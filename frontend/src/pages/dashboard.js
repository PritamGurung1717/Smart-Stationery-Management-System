import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

const Dashboard = ({ setUser }) => {
  const [user, setLocalUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const navigate = useNavigate();

  // Sample products data
  const sampleProducts = [
    { id: 1, name: "Premium Notebook", category: "Notebooks", price: 250, stock: 50, image: "📓" },
    { id: 2, name: "Gel Pens (Pack of 10)", category: "Pens", price: 120, stock: 100, image: "🖊️" },
    { id: 3, name: "Scientific Calculator", category: "Electronics", price: 800, stock: 30, image: "🧮" },
    { id: 4, name: "Geometry Box", category: "Geometry", price: 150, stock: 75, image: "📐" },
    { id: 5, name: "Sticky Notes (Pack ocdf 5)", category: "Stationery", price: 90, stock: 200, image: "📝" },
    { id: 6, name: "Backpack", category: "Bags", price: 1200, stock: 25, image: "🎒" },
    { id: 7, name: "Water Bottle", category: "Accessories", price: 300, stock: 60, image: "💧" },
    { id: 8, name: "Desk Organizer", category: "Organizers", price: 450, stock: 40, image: "🗃️" },
  ];

  const categories = ["all", "Notebooks", "Pens", "Electronics", "Geometry", "Stationery", "Bags", "Accessories", "Organizers"];

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setLocalUser(storedUser);
      // Check if institute needs verification
      if (storedUser.role === "institute" && 
          (!storedUser.instituteVerification || 
           storedUser.instituteVerification.status !== "approved")) {
        navigate("/institute-verification");
      }
    } else {
      navigate("/login");
    }
    setProducts(sampleProducts);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login", { replace: true });
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price, 0);
  };

  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  if (!user) return <div className="loading-screen"><p>Loading...</p></div>;

  return (
    <div className="dashboard-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-logo">✏️ Smart Stationery</div>
        <div className="nav-user">
          <span>Welcome, {user.name}</span>
          <span className="user-role">({user.role.toUpperCase()})</span>
        </div>
        <div className="nav-links">
          <button onClick={() => navigate("/dashboard")} className="nav-btn">Home</button>
          {user.role === "institute" && (
            <button onClick={() => navigate("/institute-verification")} className="nav-btn">
              {user.instituteVerification?.status === "approved" ? "✓ Verified" : "Verification"}
            </button>
          )}
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <h3>Categories</h3>
          <ul className="category-list">
            {categories.map(cat => (
              <li 
                key={cat} 
                className={selectedCategory === cat ? "active" : ""}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </li>
            ))}
          </ul>

          {/* CART SIDEBAR */}
          <div className="cart-section">
            <h3>🛒 Your Cart ({cart.length})</h3>
            {cart.length === 0 ? (
              <p className="empty-cart">Cart is empty</p>
            ) : (
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <span>{item.image} {item.name}</span>
                    <span>₹{item.price}</span>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="remove-btn"
                    >✕</button>
                  </div>
                ))}
                <div className="cart-total">
                  <strong>Total: ₹{getCartTotal()}</strong>
                </div>
                <button className="checkout-btn">Proceed to Checkout</button>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          <header className="welcome-section">
            <h1>Welcome to Smart Stationery, {user.name}!</h1>
            <p>Your one-stop solution for all stationery needs</p>
            
            {/* Institute Verification Status */}
            {user.role === "institute" && user.instituteVerification && (
              <div className={`verification-badge ${user.instituteVerification.status}`}>
                {user.instituteVerification.status === "approved" ? "✓ Verified Institute" : 
                 user.instituteVerification.status === "pending" ? "⏳ Verification Pending" : 
                 "✗ Verification Rejected"}
              </div>
            )}
          </header>

          {/* PRODUCTS GRID */}
          <section className="products-section">
            <h2>Featured Products</h2>
            <div className="products-grid">
              {filteredProducts.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image">{product.image}</div>
                  <h3>{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                  <p className="product-price">₹{product.price}</p>
                  <p className="product-stock">Stock: {product.stock}</p>
                  <button 
                    onClick={() => addToCart(product)}
                    className="add-to-cart-btn"
                    disabled={product.stock === 0}
                  >
                    {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* DASHBOARD STATS */}
          <section className="stats-section">
            <h2>Quick Stats</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Products Viewed</h3>
                <p className="stat-number">24</p>
              </div>
              <div className="stat-card">
                <h3>Cart Items</h3>
                <p className="stat-number">{cart.length}</p>
              </div>
              <div className="stat-card">
                <h3>Orders</h3>
                <p className="stat-number">5</p>
              </div>
              <div className="stat-card">
                <h3>Saved Items</h3>
                <p className="stat-number">12</p>
              </div>
            </div>
          </section>

          {/* ROLE-SPECIFIC CONTENT */}
          {user.role === "personal" && (
            <section className="personal-section">
              <h2>Personal Account Features</h2>
              <div className="features-list">
                <div className="feature">Personalized recommendations</div>
                <div className="feature">Free shipping on orders above ₹999</div>
                <div className="feature">Loyalty points on every purchase</div>
                <div className="feature">Order history tracking</div>
              </div>
            </section>
          )}

          {user.role === "institute" && (
            <section className="institute-section">
              <h2>Institute Account Features</h2>
              <div className="features-list">
                <div className="feature"> Bulk order discounts (10-20%)</div>
                <div className="feature"> Custom quotation generation</div>
                <div className="feature"> Monthly usage reports</div>
                <div className="feature"> Multiple user accounts</div>
                <div className="feature"> Priority shipping</div>
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="footer">
        <p>© 2025 Smart Stationery | All rights reserved.</p>
        <p className="footer-links">
          <span>Privacy Policy</span> | 
          <span>Terms of Service</span> | 
          <span>Contact Us</span> | 
          <span>Help Center</span>
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;