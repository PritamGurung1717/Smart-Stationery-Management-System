import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import toast from "../utils/toast.js";
import { API_URL } from "../utils/api.js";
import "../styles/landing.css";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [] });
  const [shippingAddress, setShippingAddress] = useState({ address: "", city: "", state: "", zipCode: "", country: "Nepal" });
  const [contactDetails, setContactDetails] = useState({ fullName: "", phone: "" });
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
    const savedContact = JSON.parse(localStorage.getItem("contactDetails") || "{}");
    if (savedContact.fullName) setContactDetails(savedContact);
    else if (storedUser?.name) setContactDetails(prev => ({ ...prev, fullName: storedUser.name, phone: storedUser.phone || "" }));
  }, [navigate]);

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/cart`);
      const cartData = res.data.cart?.items ? res.data.cart : { items: [] };

      if (cartData.items?.length) {
        const enrichedItems = await Promise.all(cartData.items.map(async (item) => {
          if (item.product && typeof item.product === "object" && item.product.name) {
            return item;
          }
          try {
            const productId = typeof item.product === "object" ? item.product.id : item.product;
            const productRes = await axios.get(`${API_URL}/products/${productId}`);
            return {
              ...item,
              productDetails: productRes.data.product || { name: `Product #${productId}`, id: productId }
            };
          } catch {
            return {
              ...item,
              productDetails: { name: `Product #${item.product}`, id: item.product }
            };
          }
        }));
        setCart({ ...cartData, items: enrichedItems });
      } else {
        setCart(cartData);
      }
    } catch { setCart({ items: [] }); }
    finally { setLoadingCart(false); }
  };

  const subtotal = cart.items.reduce((t, i) => t + i.price * i.quantity, 0);
  const discount = user?.role === "institute" ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  const validateStock = async () => {
    for (const item of cart.items) {
      try {
        const res = await axios.get(`${API_URL}/products/${item.product}`);
        const p = res.data.product;
        if (p.stock < item.quantity) return { valid: false, message: `"${p.name}" has only ${p.stock} in stock.` };
      } catch { return { valid: false, message: "Failed to check stock. Please try again." }; }
    }
    return { valid: true };
  };

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) { toast.warning("Your cart is empty!"); return; }
    if (!contactDetails.fullName.trim() || !contactDetails.phone.trim()) {
      toast.warning("Please fill in your full name and phone number!"); return;
    }
    if (!shippingAddress.address.trim() || !shippingAddress.city.trim() || !shippingAddress.state.trim() || !shippingAddress.zipCode.trim()) {
      toast.warning("Please fill in all required shipping address fields!"); return;
    }
    setLoading(true);
    try {
      const stock = await validateStock();
      if (!stock.valid) { toast.error(stock.message); return; }
      const res = await axios.post(`${API_URL}/orders`, {
        products: cart.items.map(i => ({ productId: i.product, quantity: i.quantity })),
        shippingAddress, paymentMethod, orderType, notes: ""
      });
      localStorage.setItem("shippingAddress", JSON.stringify(shippingAddress));
      localStorage.setItem("contactDetails", JSON.stringify(contactDetails));
      try { await axios.delete(`${API_URL}/users/cart/clear`); } catch {}

      const orderId = res.data.order.id || res.data.order._id;

      if (paymentMethod === "khalti") {
        navigate(`/payment/${orderId}`);
      } else {
        toast.success("Order placed successfully!");
        navigate(`/orders/${orderId}`);
      }
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.message || err.message || "Failed to place order"));
    } finally { setLoading(false); }
  };

  if (loadingCart) return (
    <SharedLayout>
      <div className="text-center py-5">
        <div className="spinner-border mb-3" style={{ width: 40, height: 40, borderWidth: 3, color: "#1D4ED8" }} role="status" />
        <p style={{ color: "#4B5563" }}>Loading checkout…</p>
      </div>
    </SharedLayout>
  );

  return (
    <SharedLayout>
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner">
          <button type="button" onClick={() => navigate("/cart")} className="ss-back-link">
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back to Cart
          </button>

          <p className="ss-section-label">CHECKOUT</p>
          <h1 className="ss-page-title mb-4">Checkout</h1>

          <div className="row g-4 align-items-start">
            <div className="col-lg-8">
              <div className="ss-card mb-4">
                <h5 className="fw-bold mb-4" style={{ color: "#111" }}>Order Summary</h5>
                {cart.items.length === 0 ? (
                  <p className="small mb-0" style={{ color: "#4B5563" }}>
                    Your cart is empty.{" "}
                    <button type="button" onClick={() => navigate("/products")} className="landing-view-all p-0 border-0 bg-transparent">Shop now</button>
                  </p>
                ) : (
                  <>
                    {cart.items.map((item, idx) => {
                      const productName = item.productDetails?.name ||
                        (typeof item.product === "object" ? item.product.name : null) ||
                        `Product #${item.product}`;
                      return (
                        <div key={item._id || idx} className="d-flex justify-content-between align-items-center py-2 border-bottom small">
                          <div>
                            <div className="fw-semibold" style={{ color: "#111" }}>{productName}</div>
                            <div style={{ color: "#4B5563" }}>Qty: {item.quantity} × ₹{item.price}</div>
                          </div>
                          <div className="fw-bold" style={{ color: "#111" }}>₹{item.price * item.quantity}</div>
                        </div>
                      );
                    })}
                    <div className="mt-3">
                      <div className="d-flex justify-content-between mb-1 small" style={{ color: "#4B5563" }}><span>Subtotal</span><span>₹{subtotal}</span></div>
                      {discount > 0 && (
                        <div className="d-flex justify-content-between mb-1 small" style={{ color: "#16A34A" }}>
                          <span>Institute Discount (10%)</span><span>-₹{discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-1" style={{ fontSize: "1.05rem", color: "#111" }}>
                        <span>Total</span><span>₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="ss-card mb-4">
                <h5 className="fw-bold mb-4" style={{ color: "#111" }}>Shipping Address</h5>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold small">Full Name *</label>
                    <input type="text" className="form-control" placeholder="Recipient's full name"
                      value={contactDetails.fullName}
                      onChange={e => setContactDetails({ ...contactDetails, fullName: e.target.value })}
                      style={{ borderColor: "#E5E7EB", borderRadius: 8 }} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold small">Phone Number *</label>
                    <input type="tel" className="form-control" placeholder="+977 98XXXXXXXX"
                      value={contactDetails.phone}
                      onChange={e => setContactDetails({ ...contactDetails, phone: e.target.value })}
                      style={{ borderColor: "#E5E7EB", borderRadius: 8 }} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Full Address *</label>
                  <input type="text" className="form-control" placeholder="Street address, apartment, suite..."
                    value={shippingAddress.address} onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    style={{ borderColor: "#E5E7EB", borderRadius: 8 }} />
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold small">City *</label>
                    <input type="text" className="form-control" placeholder="City" value={shippingAddress.city}
                      onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      style={{ borderColor: "#E5E7EB", borderRadius: 8 }} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold small">State *</label>
                    <input type="text" className="form-control" placeholder="State" value={shippingAddress.state}
                      onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      style={{ borderColor: "#E5E7EB", borderRadius: 8 }} />
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold small">ZIP Code *</label>
                    <input type="text" className="form-control" placeholder="ZIP Code" value={shippingAddress.zipCode}
                      onChange={e => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                      style={{ borderColor: "#E5E7EB", borderRadius: 8 }} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold small">Country</label>
                    <input type="text" className="form-control" value={shippingAddress.country}
                      onChange={e => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      style={{ borderColor: "#E5E7EB", borderRadius: 8 }} />
                  </div>
                </div>
              </div>

              <div className="ss-card">
                <h5 className="fw-bold mb-4" style={{ color: "#111" }}>Payment Method</h5>
                {[["cod", "Cash on Delivery (COD)"], ["esewa", "eSewa"], ["khalti", "Khalti"]].map(([val, lbl]) => (
                  <label key={val} className={`ss-payment-option ${paymentMethod === val ? "selected" : ""}`}>
                    <input type="radio" name="paymentMethod" value={val} checked={paymentMethod === val}
                      onChange={e => setPaymentMethod(e.target.value)} />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>

            <div className="col-lg-4">
              <div className="ss-card" style={{ position: "sticky", top: 80 }}>
                <h5 className="fw-bold mb-4" style={{ color: "#111" }}>Complete Order</h5>
                {user?.role === "institute" && (
                  <div className="alert small py-2 mb-3" style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
                    Institute bulk order — 10% discount applied.
                  </div>
                )}
                <div className="small mb-3">
                  <div className="d-flex justify-content-between mb-1" style={{ color: "#4B5563" }}><span>Items</span><span>{cart.items.length}</span></div>
                  <div className="d-flex justify-content-between mb-1" style={{ color: "#4B5563" }}><span>Subtotal</span><span>₹{subtotal}</span></div>
                  {discount > 0 && (
                    <div className="d-flex justify-content-between mb-1" style={{ color: "#16A34A" }}>
                      <span>Discount</span><span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-1" style={{ fontSize: "1.05rem", color: "#111" }}>
                    <span>Total</span><span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                <button type="button" onClick={handlePlaceOrder}
                  disabled={loading || cart.items.length === 0 || !contactDetails.fullName || !contactDetails.phone || !shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode}
                  className={`landing-btn-primary w-100 mb-2 ${(loading || cart.items.length === 0) ? "opacity-50" : ""}`}
                  style={{ justifyContent: "center" }}>
                  {loading
                    ? "Placing Order…"
                    : paymentMethod === "khalti"
                    ? "Place Order & Pay with Khalti"
                    : "Place Order"}
                </button>
                <button type="button" onClick={() => navigate("/cart")} className="landing-btn-outline w-100"
                  style={{ color: "#111", borderColor: "#E5E7EB", padding: "0.65rem", borderRadius: 8 }}>
                  Back to Cart
                </button>
                <p className="text-center mt-3 mb-0" style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>
                  By placing your order, you agree to our Terms of Service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SharedLayout>
  );
};

export default CheckoutPage;
