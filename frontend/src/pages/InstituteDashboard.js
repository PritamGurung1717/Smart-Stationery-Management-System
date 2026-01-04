import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./instituteDashboard.css";

const InstituteDashboard = ({ setUser }) => {
  const [user, setLocalUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [schoolInfo, setSchoolInfo] = useState({
    schoolName: "",
    type: "school",
    address: "",
    contactPerson: "",
    phone: "",
    grades: ""
  });
  const [bookSets, setBookSets] = useState([]);
  const [newBookSet, setNewBookSet] = useState({
    grade: "",
    bookName: "",
    publication: "",
    quantity: 1,
    price: ""
  });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const categories = ["all", "Textbooks", "Notebooks", "Pens", "Geometry", "Stationery", "Bags", "Electronics"];
  
  // Sample products for bulk ordering
  const sampleProducts = [
    { id: 1, name: "Mathematics Textbook Class 10", category: "Textbooks", price: 300, minOrder: 50, image: "📘" },
    { id: 2, name: "Science Notebooks (Set of 10)", category: "Notebooks", price: 200, minOrder: 100, image: "📓" },
    { id: 3, name: "Gel Pens (Box of 100)", category: "Pens", price: 800, minOrder: 50, image: "🖊️" },
    { id: 4, name: "Geometry Boxes", category: "Geometry", price: 150, minOrder: 30, image: "📐" },
    { id: 5, name: "Student Backpacks", category: "Bags", price: 500, minOrder: 20, image: "🎒" },
    { id: 6, name: "Scientific Calculators", category: "Electronics", price: 600, minOrder: 25, image: "🧮" },
    { id: 7, name: "Whiteboard Markers (Pack of 50)", category: "Stationery", price: 400, minOrder: 40, image: "🖍️" },
    { id: 8, name: "Library Books Set", category: "Textbooks", price: 5000, minOrder: 10, image: "📚" },
  ];

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      if (storedUser.role !== "institute") {
        navigate("/dashboard");
        return;
      }
      setLocalUser(storedUser);
      fetchInstituteInfo(storedUser.email);
      fetchBookSets(storedUser.email);
      fetchOrders(storedUser.email);
    } else {
      navigate("/login");
    }
    setProducts(sampleProducts);
  }, [navigate]);

  const fetchInstituteInfo = async (email) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/institute-info?email=${email}`);
      if (res.data.instituteInfo) {
        setSchoolInfo({
          schoolName: res.data.instituteInfo.schoolName || "",
          type: res.data.instituteInfo.type || "school",
          address: res.data.instituteInfo.address || "",
          contactPerson: res.data.instituteInfo.contactPerson || "",
          phone: res.data.instituteInfo.phone || "",
          grades: res.data.instituteInfo.grades?.join(", ") || ""
        });
      }
    } catch (error) {
      console.error("Error fetching institute info:", error);
    }
  };

  const fetchBookSets = async (email) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/institute-book-sets?email=${email}`);
      setBookSets(res.data.bookSets || []);
    } catch (error) {
      console.error("Error fetching book sets:", error);
    }
  };

  const fetchOrders = async (email) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/institute-orders?email=${email}`);
      setOrders(res.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleSchoolInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const gradesArray = schoolInfo.grades.split(",").map(grade => grade.trim());
      
      const res = await axios.post("http://localhost:5000/api/users/update-institute-info", {
        email: user.email,
        ...schoolInfo,
        grades: gradesArray
      });
      
      alert("School information updated successfully!");
      
      // Update local user
      const updatedUser = { 
        ...user, 
        instituteInfo: { 
          ...user.instituteInfo, 
          ...res.data.instituteInfo 
        } 
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setLocalUser(updatedUser);
      
    } catch (error) {
      alert("Error updating school information: " + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/users/add-book-set", {
        email: user.email,
        ...newBookSet
      });
      
      alert("Book set added successfully! Awaiting admin approval.");
      setNewBookSet({ grade: "", bookName: "", publication: "", quantity: 1, price: "" });
      fetchBookSets(user.email);
      
    } catch (error) {
      alert("Error adding book set: " + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOrder = (product) => {
    const quantity = prompt(`Enter quantity for ${product.name} (Minimum: ${product.minOrder}):`, product.minOrder);
    
    if (!quantity || quantity < product.minOrder) {
      alert(`Minimum order quantity is ${product.minOrder}`);
      return;
    }
    
    const totalPrice = quantity * product.price;
    
    if (window.confirm(`Order ${quantity} units of ${product.name} for ₹${totalPrice}?`)) {
      submitBulkOrder(product, quantity, totalPrice);
    }
  };

  const submitBulkOrder = async (product, quantity, totalPrice) => {
    try {
      const res = await axios.post("http://localhost:5000/api/users/add-bulk-order", {
        email: user.email,
        productId: product.id,
        productName: product.name,
        quantity: parseInt(quantity),
        unitPrice: product.price,
        totalPrice: totalPrice
      });
      
      alert("Bulk order submitted for approval!");
      fetchOrders(user.email);
      
    } catch (error) {
      alert("Error submitting order: " + error.response?.data?.message);
    }
  };

  const addToCart = (product) => {
    setCart([...cart, { ...product, quantity: product.minOrder }]);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login", { replace: true });
  };

  if (!user) return <div className="loading-screen"><p>Loading...</p></div>;

  const renderDashboard = () => (
    <>
      <div className="welcome-section">
        <h1>Welcome, {user.name}!</h1>
        <p>{schoolInfo.schoolName || "Institute Dashboard"}</p>
        
        {user.instituteVerification && (
          <div className={`verification-badge ${user.instituteVerification.status}`}>
            {user.instituteVerification.status === "approved" ? "✓ Verified Institute" : 
             user.instituteVerification.status === "pending" ? "⏳ Verification Pending" : 
             "✗ Verification Rejected"}
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Book Sets</h3>
          <p className="stat-number">{bookSets.length}</p>
          <span className="stat-subtitle">Across all grades</span>
        </div>
        
        <div className="stat-card">
          <h3>Pending Orders</h3>
          <p className="stat-number">{orders.filter(o => o.status === "pending").length}</p>
          <span className="stat-subtitle">Awaiting approval</span>
        </div>
        
        <div className="stat-card">
          <h3>Approved Orders</h3>
          <p className="stat-number">{orders.filter(o => o.status === "approved").length}</p>
          <span className="stat-subtitle">Ready for processing</span>
        </div>
        
        <div className="stat-card">
          <h3>Cart Items</h3>
          <p className="stat-number">{cart.length}</p>
          <span className="stat-subtitle">Ready to order</span>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => setActiveTab("school-info")}>
            <span className="action-icon">🏫</span>
            Update School Info
          </button>
          <button className="action-btn" onClick={() => setActiveTab("book-sets")}>
            <span className="action-icon">📚</span>
            Add Book Sets
          </button>
          <button className="action-btn" onClick={() => setActiveTab("bulk-order")}>
            <span className="action-icon">📦</span>
            Bulk Order Products
          </button>
          <button className="action-btn" onClick={() => setActiveTab("orders")}>
            <span className="action-icon">📋</span>
            View Orders
          </button>
        </div>
      </div>

      {bookSets.length > 0 && (
        <div className="recent-book-sets">
          <h2>Recent Book Sets</h2>
          <div className="book-sets-grid">
            {bookSets.slice(0, 4).map((book, index) => (
              <div key={index} className="book-set-card">
                <h4>{book.grade} - {book.bookName}</h4>
                <p>Publication: {book.publication}</p>
                <p>Quantity: {book.quantity}</p>
                <span className={`status-badge ${book.status}`}>
                  {book.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const renderSchoolInfo = () => (
    <div className="form-section">
      <h2>Institute Information</h2>
      <p className="section-subtitle">Update your school/college details</p>
      
      <form onSubmit={handleSchoolInfoSubmit} className="institute-form">
        <div className="form-row">
          <div className="form-group">
            <label>Institute Name *</label>
            <input
              type="text"
              value={schoolInfo.schoolName}
              onChange={(e) => setSchoolInfo({...schoolInfo, schoolName: e.target.value})}
              placeholder="Enter institute name"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Institute Type *</label>
            <select
              value={schoolInfo.type}
              onChange={(e) => setSchoolInfo({...schoolInfo, type: e.target.value})}
              required
            >
              <option value="school">School</option>
              <option value="college">College/University</option>
              <option value="wholesaler">Wholesaler</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Address</label>
          <textarea
            value={schoolInfo.address}
            onChange={(e) => setSchoolInfo({...schoolInfo, address: e.target.value})}
            placeholder="Enter full address"
            rows="3"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Contact Person *</label>
            <input
              type="text"
              value={schoolInfo.contactPerson}
              onChange={(e) => setSchoolInfo({...schoolInfo, contactPerson: e.target.value})}
              placeholder="Contact person name"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={schoolInfo.phone}
              onChange={(e) => setSchoolInfo({...schoolInfo, phone: e.target.value})}
              placeholder="Phone number"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Grades/Classes (comma separated)</label>
          <input
            type="text"
            value={schoolInfo.grades}
            onChange={(e) => setSchoolInfo({...schoolInfo, grades: e.target.value})}
            placeholder="e.g., 1, 2, 3, 4, 5 or FY, SY, TY"
          />
        </div>
        
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Updating..." : "Update Information"}
        </button>
      </form>
    </div>
  );

  const renderBookSets = () => (
    <div className="form-section">
      <h2>Book Sets Management</h2>
      <p className="section-subtitle">Add book sets for each grade (requires admin approval)</p>
      
      <div className="two-column-layout">
        <div className="left-column">
          <h3>Add New Book Set</h3>
          <form onSubmit={handleBookSetSubmit} className="book-set-form">
            <div className="form-group">
              <label>Grade/Class *</label>
              <input
                type="text"
                value={newBookSet.grade}
                onChange={(e) => setNewBookSet({...newBookSet, grade: e.target.value})}
                placeholder="e.g., 10th Grade, FY B.Com"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Book Name *</label>
              <input
                type="text"
                value={newBookSet.bookName}
                onChange={(e) => setNewBookSet({...newBookSet, bookName: e.target.value})}
                placeholder="e.g., Mathematics Part II"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Publication *</label>
              <input
                type="text"
                value={newBookSet.publication}
                onChange={(e) => setNewBookSet({...newBookSet, publication: e.target.value})}
                placeholder="e.g., NCERT, Oxford University Press"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  value={newBookSet.quantity}
                  onChange={(e) => setNewBookSet({...newBookSet, quantity: e.target.value})}
                  min="1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Price (₹)</label>
                <input
                  type="number"
                  value={newBookSet.price}
                  onChange={(e) => setNewBookSet({...newBookSet, price: e.target.value})}
                  placeholder="Optional"
                  min="0"
                />
              </div>
            </div>
            
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Adding..." : "Add Book Set"}
            </button>
          </form>
        </div>
        
        <div className="right-column">
          <h3>Your Book Sets ({bookSets.length})</h3>
          {bookSets.length === 0 ? (
            <div className="empty-state">
              <p>No book sets added yet</p>
            </div>
          ) : (
            <div className="book-sets-list">
              {bookSets.map((book, index) => (
                <div key={index} className="book-set-item">
                  <div className="book-set-header">
                    <h4>{book.grade} - {book.bookName}</h4>
                    <span className={`status-badge ${book.status}`}>
                      {book.status}
                    </span>
                  </div>
                  <div className="book-set-details">
                    <p><strong>Publication:</strong> {book.publication}</p>
                    <p><strong>Quantity:</strong> {book.quantity}</p>
                    {book.price && <p><strong>Price:</strong> ₹{book.price}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBulkOrder = () => (
    <div className="bulk-order-section">
      <div className="section-header">
        <h2>Bulk Order Products</h2>
        <p className="section-subtitle">Order in bulk for your institute (Special discounts available)</p>
      </div>
      
      <div className="institute-cart">
        <h3>🛒 Your Bulk Order Cart ({cart.length})</h3>
        {cart.length === 0 ? (
          <div className="empty-cart">
            <p>Your bulk order cart is empty</p>
            <p>Add products from below to get started</p>
          </div>
        ) : (
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <span className="cart-item-image">{item.image}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <p>Min order: {item.minOrder} units</p>
                  </div>
                </div>
                <div className="cart-item-quantity">
                  <input 
                    type="number" 
                    min={item.minOrder}
                    value={item.quantity}
                    onChange={(e) => {
                      const newCart = [...cart];
                      const itemIndex = newCart.findIndex(i => i.id === item.id);
                      if (itemIndex !== -1) {
                        newCart[itemIndex].quantity = Math.max(item.minOrder, parseInt(e.target.value) || item.minOrder);
                        setCart(newCart);
                      }
                    }}
                  />
                </div>
                <div className="cart-item-price">
                  ₹{item.price * item.quantity}
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="remove-btn"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="cart-total">
              <h4>Total: ₹{getCartTotal()}</h4>
              <button 
                className="checkout-btn"
                onClick={() => {
                  if (cart.length > 0) {
                    if (window.confirm(`Submit bulk order for ₹${getCartTotal()}?`)) {
                      cart.forEach(item => {
                        submitBulkOrder(item, item.quantity, item.price * item.quantity);
                      });
                      setCart([]);
                      alert("All items submitted for approval!");
                    }
                  }
                }}
              >
                Submit Bulk Order for Approval
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bulk-products-section">
        <h3>Available Products for Bulk Order</h3>
        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-filter ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card bulk">
              <div className="product-image">{product.image}</div>
              <h3>{product.name}</h3>
              <p className="product-category">{product.category}</p>
              <p className="product-price">₹{product.price} per unit</p>
              <p className="product-min-order">Min order: {product.minOrder} units</p>
              <div className="product-actions">
                <button 
                  onClick={() => addToCart(product)}
                  className="add-to-cart-btn"
                >
                  Add to Bulk Cart
                </button>
                <button 
                  onClick={() => handleBulkOrder(product)}
                  className="quick-order-btn"
                >
                  Quick Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="orders-section">
      <h2>Your Orders</h2>
      <p className="section-subtitle">Track your bulk orders</p>
      
      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders placed yet</p>
          <button onClick={() => setActiveTab("bulk-order")} className="action-btn">
            Place Your First Order
          </button>
        </div>
      ) : (
        <div className="orders-table">
          <table>
            <thead>
              <tr>
                <th>Order Date</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index}>
                  <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td>{order.productName}</td>
                  <td>{order.quantity}</td>
                  <td>₹{order.unitPrice}</td>
                  <td>₹{order.totalPrice}</td>
                  <td>
                    <span className={`status-badge ${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-logo">✏️ Smart Stationery</div>
        <div className="nav-user">
          <span>Welcome, {user.name}</span>
          <span className="user-role">INSTITUTE</span>
          {schoolInfo.schoolName && <span className="institute-name">{schoolInfo.schoolName}</span>}
        </div>
        <div className="nav-links">
          <button onClick={() => setActiveTab("dashboard")} className="nav-btn">Dashboard</button>
          <button onClick={() => setActiveTab("school-info")} className="nav-btn">School Info</button>
          <button onClick={() => setActiveTab("book-sets")} className="nav-btn">Book Sets</button>
          <button onClick={() => setActiveTab("bulk-order")} className="nav-btn">Bulk Order</button>
          <button onClick={() => setActiveTab("orders")} className="nav-btn">Orders</button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Quick Links</h3>
            <ul className="sidebar-menu">
              <li className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
                📊 Dashboard
              </li>
              <li className={activeTab === "school-info" ? "active" : ""} onClick={() => setActiveTab("school-info")}>
                🏫 School Information
              </li>
              <li className={activeTab === "book-sets" ? "active" : ""} onClick={() => setActiveTab("book-sets")}>
                📚 Book Sets
              </li>
              <li className={activeTab === "bulk-order" ? "active" : ""} onClick={() => setActiveTab("bulk-order")}>
                📦 Bulk Order
              </li>
              <li className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>
                📋 Orders
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3>Institute Stats</h3>
            <div className="sidebar-stats">
              <div className="sidebar-stat">
                <span>Book Sets</span>
                <strong>{bookSets.length}</strong>
              </div>
              <div className="sidebar-stat">
                <span>Pending Orders</span>
                <strong>{orders.filter(o => o.status === "pending").length}</strong>
              </div>
              <div className="sidebar-stat">
                <span>Approved</span>
                <strong>{orders.filter(o => o.status === "approved").length}</strong>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Need Help?</h3>
            <p className="help-text">Contact support for bulk order discounts and custom requirements</p>
            <button className="help-btn">Contact Support</button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "school-info" && renderSchoolInfo()}
          {activeTab === "book-sets" && renderBookSets()}
          {activeTab === "bulk-order" && renderBulkOrder()}
          {activeTab === "orders" && renderOrders()}
        </main>
      </div>

      <footer className="footer">
        <p>© 2025 Smart Stationery | Institute Dashboard | All rights reserved.</p>
        <p className="footer-links">
          <span>Bulk Order Support</span> | 
          <span>Institutional Discounts</span> | 
          <span>Contact Admin</span> | 
          <span>Help Center</span>
        </p>
      </footer>
    </div>
  );
};

export default InstituteDashboard;