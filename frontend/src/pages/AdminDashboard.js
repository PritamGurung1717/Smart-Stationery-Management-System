import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./adminDashboard.css";

const AdminDashboard = ({ setUser }) => {
  const [admin, setAdmin] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    revenue: 0,
    pendingVerifications: 0
  });
  
  // Products state
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    image: ""
  });
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Users state
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "personal",
    phone: "",
    address: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Axios interceptor to add token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser && storedUser.role === "admin") {
      setAdmin(storedUser);
      fetchDashboardData();
      fetchPendingVerifications();
      if (activeTab === "products") fetchProducts();
      if (activeTab === "users") fetchUsers();
    } else {
      navigate("/login");
    }
  }, [navigate, activeTab, currentPage]);

  const fetchDashboardData = async () => {
    try {
      // Fetch products count
      const productsRes = await axios.get("http://localhost:5000/api/products?limit=1");
      
      // Fetch users count
      const usersRes = await axios.get("http://localhost:5000/api/users/admin/users?limit=1");
      
      // Fetch product stats
      const statsRes = await axios.get("http://localhost:5000/api/products/stats/summary");
      
      setStats({
        totalUsers: usersRes.data.total || 0,
        totalProducts: productsRes.data.totalProducts || 0,
        totalOrders: 0, // You'll need to implement order fetching
        revenue: statsRes.data.stats?.inventoryValue || 0,
        pendingVerifications: pendingVerifications.length
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const fetchPendingVerifications = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/admin/pending-verifications");
      setPendingVerifications(res.data.pendingVerifications || []);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/admin/users?page=${currentPage}&limit=10&search=${searchTerm}`);
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleVerificationUpdate = async (userId, status) => {
    try {
      const comments = prompt(`Enter comments for ${status}:`, "");
      if (comments === null) return;

      await axios.put(`http://localhost:5000/api/users/admin/verifications/${userId}`, {
        status,
        comments
      });

      alert(`Verification ${status} successfully!`);
      fetchPendingVerifications();
      fetchDashboardData();
    } catch (error) {
      alert("Error updating verification: " + error.message);
    }
  };

  // Product CRUD Operations
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.category || !newProduct.price) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/products", newProduct);
      alert("Product added successfully!");
      setProducts([...products, res.data.product]);
      setNewProduct({ name: "", category: "", price: "", stock: "", description: "", image: "" });
      fetchDashboardData();
    } catch (error) {
      alert("Error adding product: " + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setLoading(true);
    try {
      const res = await axios.put(`http://localhost:5000/api/products/${editingProduct._id}`, editingProduct);
      alert("Product updated successfully!");
      setProducts(products.map(p => p._id === editingProduct._id ? res.data.product : p));
      setEditingProduct(null);
    } catch (error) {
      alert("Error updating product: " + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${productId}`);
        alert("Product deleted successfully!");
        setProducts(products.filter(p => p._id !== productId));
        fetchDashboardData();
      } catch (error) {
        alert("Error deleting product: " + error.response?.data?.message);
      }
    }
  };

  // User CRUD Operations
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/users/admin/create-user", newUser);
      alert("User created successfully!");
      setUsers([...users, res.data.user]);
      setNewUser({ name: "", email: "", password: "", role: "personal", phone: "", address: "" });
      fetchDashboardData();
    } catch (error) {
      alert("Error creating user: " + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/users/admin/users/${userId}`, { status });
      alert(`User ${status} successfully!`);
      setUsers(users.map(u => u._id === userId ? { ...u, status } : u));
    } catch (error) {
      alert("Error updating user: " + error.response?.data?.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`http://localhost:5000/api/users/admin/users/${userId}`);
        alert("User deleted successfully!");
        setUsers(users.filter(u => u._id !== userId));
        fetchDashboardData();
      } catch (error) {
        alert("Error deleting user: " + error.response?.data?.message);
      }
    }
  };

  const handleSearchUsers = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  if (!admin) return <div className="loading-screen"><p>Loading Admin Dashboard...</p></div>;

  const renderDashboard = () => (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="number">{stats.totalUsers}</p>
        </div>

        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="number">{stats.totalProducts}</p>
        </div>

        <div className="stat-card">
          <h3>Inventory Value</h3>
          <p className="number">₹{stats.revenue.toLocaleString()}</p>
        </div>

        <div className="stat-card warning">
          <h3>Pending Verifications</h3>
          <p className="number">{pendingVerifications.length}</p>
          <span className="stat-change">Requires attention</span>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="recent-activities">
        <h3>Recent Activities</h3>
        <div className="activity-list">
          {pendingVerifications.slice(0, 5).map(user => (
            <div key={user._id} className="activity-item">
              <div className="activity-icon">🏫</div>
              <div className="activity-content">
                <p><strong>{user.name}</strong> submitted institute verification</p>
                <small>{new Date(user.createdAt).toLocaleDateString()}</small>
              </div>
              <button 
                className="action-btn small"
                onClick={() => {
                  setActiveTab("verifications");
                }}
              >
                Review
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderProducts = () => (
    <div className="products-management">
      <h2>Product Management</h2>
      
      {/* Add/Edit Product Form */}
      <div className="add-product-form">
        <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
        <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Product Name *"
              value={editingProduct ? editingProduct.name : newProduct.name}
              onChange={(e) => editingProduct 
                ? setEditingProduct({...editingProduct, name: e.target.value})
                : setNewProduct({...newProduct, name: e.target.value})
              }
              required
            />
            <input
              type="text"
              placeholder="Category *"
              value={editingProduct ? editingProduct.category : newProduct.category}
              onChange={(e) => editingProduct 
                ? setEditingProduct({...editingProduct, category: e.target.value})
                : setNewProduct({...newProduct, category: e.target.value})
              }
              required
            />
          </div>
          <div className="form-row">
            <input
              type="number"
              placeholder="Price (₹) *"
              value={editingProduct ? editingProduct.price : newProduct.price}
              onChange={(e) => editingProduct 
                ? setEditingProduct({...editingProduct, price: e.target.value})
                : setNewProduct({...newProduct, price: e.target.value})
              }
              required
            />
            <input
              type="number"
              placeholder="Stock"
              value={editingProduct ? editingProduct.stock : newProduct.stock}
              onChange={(e) => editingProduct 
                ? setEditingProduct({...editingProduct, stock: e.target.value})
                : setNewProduct({...newProduct, stock: e.target.value})
              }
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Product Description"
              value={editingProduct ? editingProduct.description : newProduct.description}
              onChange={(e) => editingProduct 
                ? setEditingProduct({...editingProduct, description: e.target.value})
                : setNewProduct({...newProduct, description: e.target.value})
              }
              rows="3"
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Image URL (optional)"
              value={editingProduct ? editingProduct.image : newProduct.image}
              onChange={(e) => editingProduct 
                ? setEditingProduct({...editingProduct, image: e.target.value})
                : setNewProduct({...newProduct, image: e.target.value})
              }
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="add-btn" disabled={loading}>
              {loading ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
            </button>
            {editingProduct && (
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setEditingProduct(null)}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Products List */}
      <div className="products-list">
        <h3>All Products ({products.length})</h3>
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id}>
                  <td>
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <small className="product-desc">{product.description || "No description"}</small>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>₹{product.price}</td>
                  <td>
                    <span className={`stock-badge ${product.stock > 10 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-of-stock'}`}>
                      {product.stock > 0 ? product.stock : "Out of Stock"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="edit-btn"
                        onClick={() => setEditingProduct(product)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteProduct(product._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="empty-state">
              <p>No products found. Add your first product!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="users-management">
      <h2>User Management</h2>
      
      {/* Search and Add User */}
      <div className="users-header">
        <form onSubmit={handleSearchUsers} className="search-form">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        
        <button 
          className="add-user-btn"
          onClick={() => document.getElementById('addUserModal').style.display = 'block'}
        >
          + Add New User
        </button>
      </div>

      {/* Add User Modal */}
      <div id="addUserModal" className="modal">
        <div className="modal-content">
          <span className="close" onClick={() => document.getElementById('addUserModal').style.display = 'none'}>&times;</span>
          <h3>Add New User</h3>
          <form onSubmit={handleAddUser}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Full Name *"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email *"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password *"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                required
              >
                <option value="personal">Personal</option>
                <option value="institute">Institute</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Phone (optional)"
                value={newUser.phone}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Address (optional)"
                value={newUser.address}
                onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                rows="2"
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    {user.phone && <small>Phone: {user.phone}</small>}
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className={`status-btn ${user.status === 'active' ? 'suspend' : 'activate'}`}
                      onClick={() => handleUpdateUserStatus(user._id, user.status === 'active' ? 'suspended' : 'active')}
                    >
                      {user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={user._id === admin._id}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="empty-state">
            <p>No users found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderVerifications = () => (
    <div className="verifications-section">
      <h2>Institute Verifications</h2>
      <p className="section-subtitle">Review and approve institute account verifications</p>
      
      {pendingVerifications.length === 0 ? (
        <div className="empty-state">
          <p>No pending verifications</p>
        </div>
      ) : (
        <div className="verifications-grid">
          {pendingVerifications.map(user => (
            <div key={user._id} className="verification-card">
              <div className="verification-header">
                <h4>{user.name}</h4>
                <span className="verification-date">
                  Submitted: {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="verification-details">
                <p><strong>Institute:</strong> {user.instituteVerification?.instituteName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Invoice No:</strong> {user.instituteVerification?.invoiceNumber}</p>
                <p><strong>PAN No:</strong> {user.instituteVerification?.panNumber}</p>
                <p><strong>Contact:</strong> {user.instituteVerification?.contactNumber}</p>
              </div>
              <div className="verification-actions">
                <button 
                  className="approve-btn"
                  onClick={() => handleVerificationUpdate(user._id, "approved")}
                >
                  ✓ Approve
                </button>
                <button 
                  className="reject-btn"
                  onClick={() => handleVerificationUpdate(user._id, "rejected")}
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2 className="logo">Admin Panel</h2>
        
        <div className="admin-info">
          <p><strong>{admin.name}</strong></p>
          <p className="admin-email">{admin.email}</p>
          <p className="admin-role">Super Admin</p>
        </div>

        <ul className="menu">
          <li 
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </li>
          <li 
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            Users
          </li>
          <li 
            className={activeTab === "products" ? "active" : ""}
            onClick={() => setActiveTab("products")}
          >
            Products
          </li>
          <li 
            className={activeTab === "verifications" ? "active" : ""}
            onClick={() => setActiveTab("verifications")}
          >
            Verifications <span className="badge-count">{pendingVerifications.length}</span>
          </li>
        </ul>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="header">
          <h1>Welcome back, {admin.name}!</h1>
          <p>Admin Dashboard - Manage your stationery store</p>
          <div className="header-actions">
            <div className="date-display">{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>
        </header>

        {/* CONTENT BASED ON ACTIVE TAB */}
        <div className="content-area">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "users" && renderUsers()}
          {activeTab === "products" && renderProducts()}
          {activeTab === "verifications" && renderVerifications()}
        </div>

        <footer className="footer">
          © 2025 Smart Stationery | Admin Dashboard v2.0
        </footer>
      </main>
    </div>
  );
};

export default AdminDashboard;