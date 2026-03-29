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
    if (!token || !storedUser) { navigate("/"); return; }
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
        if (p.stock < item.quantity) return { valid: false, message: `"${p.name}" has only ${p.stock} in stock.` };
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

  if (loadingCart) return (
    <SharedLayout>
      <div className="text-center py-5 text-muted">Loading checkout…</div>
    </SharedLayout>
  );

  return (
    <SharedLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto" }} className="px-3 py-4">

        <button onClick={() => navigate("/cart")}
          className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-3 text-decoration-none">
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>

        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.2rem", fontWeight: 400 }}
          className="mb-4">Checkout</h1>

        <div className="row g-4 align-items-start">
          {/* Left */}
          <div className="col-lg-8">
            {/* Order summary */}
            <div className="border rounded-3 bg-white p-4 mb-4">
              <h5 className="fw-bold mb-4">Order Summary</h5>
              {cart.items.length === 0 ? (
                <p className="text-muted small">Your cart is empty. <button onClick={() => navigate("/products")} className="btn btn-link p-0 small fw-semibold text-dark">Shop now</button></p>
              ) : (
                <>
                  {cart.items.map((item, idx) => (
                    <div key={item._id || idx} className="d-flex justify-content-between align-items-center py-2 border-bottom small">
                      <div>
                        <div className="fw-semibold">Product #{item.product}</div>
                        <div className="text-muted">Qty: {item.quantity} × ₹{item.price}</div>
                      </div>
                      <div className="fw-bold">₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                  <div className="mt-3">
                    <div className="d-flex justify-content-between text-muted mb-1 small"><span>Subtotal</span><span>₹{subtotal}</span></div>
                    {discount > 0 && <div className="d-flex justify-content-between text-success mb-1 small"><span>Institute Discount (10%)</span><span>-₹{discount.toFixed(2)}</span></div>}
                    <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-1" style={{ fontSize: "1.05rem" }}><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                  </div>
                </>
              )}
            </div>

            {/* Shipping */}
            <div className="border rounded-3 bg-white p-4 mb-4">
              <h5 className="fw-bold mb-4">Shipping Address</h5>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Full Address *</label>
                <input type="text" className="form-control" placeholder="Enter your full address"
                  value={shippingAddress.address} onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })} />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-6"><label className="form-label fw-semibold small">City *</label>
                  <input type="text" className="form-control" placeholder="City" value={shippingAddress.city} onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })} /></div>
                <div className="col-6"><label className="form-label fw-semibold small">State *</label>
                  <input type="text" className="form-control" placeholder="State" value={shippingAddress.state} onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })} /></div>
              </div>
              <div className="row g-3">
                <div className="col-6"><label className="form-label fw-semibold small">ZIP Code *</label>
                  <input type="text" className="form-control" placeholder="ZIP Code" value={shippingAddress.zipCode} onChange={e => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })} /></div>
                <div className="col-6"><label className="form-label fw-semibold small">Country</label>
                  <input type="text" className="form-control" value={shippingAddress.country} onChange={e => setShippingAddress({ ...shippingAddress, country: e.target.value })} /></div>
              </div>
            </div>

            {/* Payment */}
            <div className="border rounded-3 bg-white p-4">
              <h5 className="fw-bold mb-4">Payment Method</h5>
              {[["cod","Cash on Delivery (COD)"],["esewa","eSewa"],["khalti","Khalti"]].map(([val, lbl]) => (
                <label key={val} className="d-flex align-items-center gap-3 p-3 rounded-3 mb-2"
                  style={{ border: `1.5px solid ${paymentMethod === val ? "#111" : "#e5e7eb"}`, cursor: "pointer", fontWeight: paymentMethod === val ? 600 : 400 }}>
                  <input type="radio" name="paymentMethod" value={val} checked={paymentMethod === val}
                    onChange={e => setPaymentMethod(e.target.value)} style={{ accentColor: "#111" }} />
                  {lbl}
                </label>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="col-lg-4">
            <div className="border rounded-3 bg-white p-4" style={{ position: "sticky", top: 80 }}>
              <h5 className="fw-bold mb-4">Complete Order</h5>
              {user?.role === "institute" && (
                <div className="alert alert-info small py-2 mb-3">Institute bulk order — 10% discount applied.</div>
              )}
              <div className="small mb-3">
                <div className="d-flex justify-content-between text-muted mb-1"><span>Items</span><span>{cart.items.length}</span></div>
                <div className="d-flex justify-content-between text-muted mb-1"><span>Subtotal</span><span>₹{subtotal}</span></div>
                {discount > 0 && <div className="d-flex justify-content-between text-success mb-1"><span>Discount</span><span>-₹{discount.toFixed(2)}</span></div>}
                <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-1" style={{ fontSize: "1.05rem" }}><span>Total</span><span>₹{total.toFixed(2)}</span></div>
              </div>
              <button onClick={handlePlaceOrder}
                disabled={loading || cart.items.length === 0 || !shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode}
                className={`btn btn-dark fw-bold w-100 mb-2 ${(loading || cart.items.length === 0) ? "opacity-50" : ""}`}>
                {loading ? "Placing Order…" : "Place Order"}
              </button>
              <button onClick={() => navigate("/cart")} className="btn btn-outline-secondary fw-semibold w-100">Back to Cart</button>
              <p className="text-muted text-center mt-3 mb-0" style={{ fontSize: "0.78rem" }}>By placing your order, you agree to our Terms of Service.</p>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default CheckoutPage;
