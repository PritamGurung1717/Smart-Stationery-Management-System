import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import { API_URL } from "../utils/api.js";
import { imgUrl } from "../utils/imgUrl.js";
import toast from "../utils/toast.js";
import confirm from "../utils/confirm.js";
import "../styles/landing.css";

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({ address: "", city: "", state: "", zipCode: "", country: "Nepal" });
  const [contactDetails, setContactDetails] = useState({ fullName: "", phone: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!token || !storedUser) { navigate("/"); return; }
    setUser(storedUser);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    fetchCart();
    if (storedUser.address) setShippingAddress(prev => ({ ...prev, address: storedUser.address }));
    if (storedUser.name) setContactDetails(prev => ({ ...prev, fullName: storedUser.name, phone: storedUser.phone || "" }));
    const savedContact = JSON.parse(localStorage.getItem("contactDetails") || "{}");
    if (savedContact.fullName) setContactDetails(savedContact);
  }, [navigate]);

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/cart`);
      const cartData = res.data.cart || { items: [] };

      if (cartData.items?.length) {
        const enriched = await Promise.all(cartData.items.map(async item => {
          if (item.product && typeof item.product === "object" && item.product.name) return item;
          try {
            const pid = typeof item.product === "object" ? item.product.id : item.product;
            const pr = await axios.get(`${API_URL}/products/${pid}`);
            return { ...item, product: pr.data.product || item.product };
          } catch { return item; }
        }));
        setCart({ ...cartData, items: enriched });
      } else {
        setCart(cartData);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) { await removeFromCart(productId); return; }
    try {
      await axios.put(`${API_URL}/users/cart/update`, { productId, quantity });
      fetchCart();
    } catch { toast.error("Failed to update quantity"); }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`${API_URL}/users/cart/remove/${productId}`);
      fetchCart();
    } catch { toast.error("Failed to remove item"); }
  };

  const clearCart = async () => {
    const confirmed = await confirm("Are you sure you want to clear your cart? This action cannot be undone.", {
      title: "Clear Cart",
      confirmText: "Clear Cart",
      cancelText: "Cancel"
    });
    if (!confirmed) return;
    try { await axios.delete(`${API_URL}/users/cart/clear`); setCart({ items: [] }); }
    catch { toast.error("Failed to clear cart"); }
  };

  const subtotal = cart.items.reduce((t, i) => t + i.price * i.quantity, 0);
  const discount = user?.role === "institute" ? subtotal * 0.1 : 0;
  const total = subtotal - discount;
  const fmt = (n) => Number(n).toLocaleString("en-IN");

  const proceedToCheckout = () => {
    if (cart.items.length === 0) { toast.warning("Your cart is empty!"); return; }
    if (!contactDetails.fullName.trim() || !contactDetails.phone.trim()) {
      toast.warning("Please fill in your full name and phone number!"); return;
    }
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode) {
      toast.warning("Please fill in all shipping details"); return;
    }
    localStorage.setItem("cart", JSON.stringify(cart.items));
    localStorage.setItem("shippingAddress", JSON.stringify(shippingAddress));
    localStorage.setItem("contactDetails", JSON.stringify(contactDetails));
    navigate("/checkout");
  };

  const inp = { borderColor: "#E5E7EB", borderRadius: 8 };

  if (loading) return (
    <SharedLayout>
      <div className="text-center py-5">
        <div className="spinner-border mb-3" style={{ width: 40, height: 40, borderWidth: 3, color: "#1D4ED8" }} role="status" />
        <p style={{ color: "#4B5563" }}>Loading cart…</p>
      </div>
    </SharedLayout>
  );

  return (
    <SharedLayout>
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner">
          <button type="button" onClick={() => navigate("/products")} className="ss-back-link">
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Continue Shopping
          </button>

          <p className="ss-section-label">CART</p>
          <h1 className="ss-page-title mb-4">Shopping Cart</h1>

          {cart.items.length === 0 ? (
            <div className="ss-card text-center py-5">
              <div style={{ fontSize: "3.5rem" }} className="mb-3">🛒</div>
              <h3 className="fw-bold mb-1" style={{ color: "#111" }}>Your cart is empty</h3>
              <p className="mb-4" style={{ color: "#4B5563" }}>Looks like you haven't added anything yet.</p>
              <button type="button" onClick={() => navigate("/products")} className="landing-btn-primary px-4">Browse Products</button>
            </div>
          ) : (
            <div className="row g-4 align-items-start">
              <div className="col-lg-8">
                <div className="ss-card mb-4 p-0 overflow-hidden">
                  <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
                    <h5 className="fw-bold mb-0" style={{ color: "#111" }}>Cart Items ({cart.items.length})</h5>
                    <button type="button" onClick={clearCart} className="btn btn-sm fw-semibold"
                      style={{ color: "#DC2626", border: "1px solid #FECACA", background: "#FEF2F2", borderRadius: 8 }}>
                      Clear Cart
                    </button>
                  </div>
                  <div className="d-none d-md-grid px-4 py-2 border-bottom"
                    style={{ gridTemplateColumns: "1fr 80px 120px 80px 70px", gap: "1rem", fontSize: "0.78rem", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.05em", background: "#F9FAFB" }}>
                    <span>Product</span><span className="text-center">Price</span><span className="text-center">Quantity</span><span className="text-center">Total</span><span />
                  </div>
                  {cart.items.map(item => (
                    <div key={item.product?.id || item.product}
                      className="px-4 py-3 border-top d-grid align-items-center"
                      style={{ gridTemplateColumns: "1fr 80px 120px 80px 70px", gap: "1rem" }}>
                      <div className="d-flex align-items-center gap-2">
                        {(item.product?.image || item.product?.image_url) && (
                          <img src={imgUrl(item.product.image || item.product.image_url)} alt={item.product.name} className="rounded-2" crossOrigin="anonymous" loading="lazy" style={{ width: 44, height: 44, objectFit: "cover", border: "1px solid #E5E7EB" }} />
                        )}
                        <div>
                          <div className="fw-semibold small" style={{ color: "#111" }}>{item.product?.name || item.name || `Product #${item.product}`}</div>
                          <div style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>{item.product?.category || ""}</div>
                        </div>
                      </div>
                      <div className="text-center fw-semibold small" style={{ color: "#111" }}>₹{fmt(item.price)}</div>
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <button type="button" className="ss-qty-btn" onClick={() => updateQuantity(item.product?.id || item.product, item.quantity - 1)}>−</button>
                        <span className="fw-bold" style={{ minWidth: 20, textAlign: "center", color: "#111" }}>{item.quantity}</span>
                        <button type="button" className="ss-qty-btn" onClick={() => updateQuantity(item.product?.id || item.product, item.quantity + 1)}>+</button>
                      </div>
                      <div className="text-center fw-bold" style={{ color: "#111" }}>₹{fmt(item.price * item.quantity)}</div>
                      <div className="text-center">
                        <button type="button" onClick={() => removeFromCart(item.product?.id || item.product)}
                          className="btn btn-link p-0 small fw-semibold text-decoration-none" style={{ color: "#DC2626" }}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ss-card">
                  <h5 className="fw-bold mb-4" style={{ color: "#111" }}>Shipping Address</h5>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Full Name *</label>
                      <input type="text" className="form-control" placeholder="Recipient's full name"
                        value={contactDetails.fullName}
                        onChange={e => setContactDetails({ ...contactDetails, fullName: e.target.value })}
                        style={inp} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Phone Number *</label>
                      <input type="tel" className="form-control" placeholder="+977 98XXXXXXXX"
                        value={contactDetails.phone}
                        onChange={e => setContactDetails({ ...contactDetails, phone: e.target.value })}
                        style={inp} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Full Address *</label>
                    <input type="text" className="form-control" placeholder="Street address, apartment, suite…"
                      value={shippingAddress.address} onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                      style={inp} />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">City *</label>
                      <input type="text" className="form-control" placeholder="City"
                        value={shippingAddress.city} onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        style={inp} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">State</label>
                      <input type="text" className="form-control" placeholder="State"
                        value={shippingAddress.state} onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        style={inp} />
                    </div>
                  </div>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">ZIP Code *</label>
                      <input type="text" className="form-control" placeholder="ZIP Code"
                        value={shippingAddress.zipCode} onChange={e => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                        style={inp} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Country</label>
                      <input type="text" className="form-control" placeholder="Country"
                        value={shippingAddress.country} onChange={e => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                        style={inp} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="ss-card" style={{ position: "sticky", top: 80 }}>
                  <h5 className="fw-bold mb-4" style={{ color: "#111" }}>Order Summary</h5>
                  <div className="d-flex justify-content-between mb-2 small" style={{ color: "#4B5563" }}><span>Subtotal</span><span>₹{fmt(subtotal)}</span></div>
                  <div className="d-flex justify-content-between mb-2 small"><span style={{ color: "#4B5563" }}>Shipping</span><span className="fw-semibold" style={{ color: "#16A34A" }}>Free</span></div>
                  {discount > 0 && (
                    <div className="d-flex justify-content-between mb-2 small" style={{ color: "#16A34A" }}><span>Bulk Discount (10%)</span><span>-₹{fmt(discount.toFixed(2))}</span></div>
                  )}
                  <div className="d-flex justify-content-between fw-bold border-top pt-3 mt-2" style={{ fontSize: "1.1rem", color: "#111" }}>
                    <span>Total</span><span>₹{fmt(total.toFixed(2))}</span>
                  </div>
                  {user?.role === "institute" && (
                    <div className="alert small py-2 mt-3 mb-0" style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
                      Institute discount of 10% applied on all orders.
                    </div>
                  )}
                  <div className="d-flex flex-column gap-2 mt-4">
                    <button type="button" onClick={proceedToCheckout} className="landing-btn-primary w-100" style={{ justifyContent: "center" }}>Proceed to Checkout</button>
                    <button type="button" onClick={() => navigate("/products")} className="landing-btn-outline w-100"
                      style={{ color: "#111", borderColor: "#E5E7EB", padding: "0.65rem", borderRadius: 8, justifyContent: "center" }}>
                      Continue Shopping
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </SharedLayout>
  );
};

export default CartPage;
