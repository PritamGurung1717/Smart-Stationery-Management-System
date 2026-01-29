// frontend/src/pages/admin/AdminDashboard.jsx - FIXED WITH UNIQUE KEYS
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Row, Col, Card, Button, Table, Badge,
  Spinner, Nav, Modal, Alert, Form, InputGroup, Pagination
} from "react-bootstrap";
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaChartLine,
  FaUsers, FaBox, FaShoppingCart, FaCheckCircle,
  FaSignOutAlt, FaExclamationTriangle, FaUserCheck,
  FaRupeeSign, FaCube, FaListOl, FaSync, FaSearch, FaFilter,
  FaSort, FaSortUp, FaSortDown, FaIdCard
} from "react-icons/fa";

const AdminDashboard = ({ setUser }) => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
    pendingVerifications: 0,
    outOfStock: 0,
    lowStock: 0,
  });

  // States for each tab
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);

  // User names mapping for orders
  const [userNames, setUserNames] = useState({});

  // Search and Filter states for each tab
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");

  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStockFilter, setProductStockFilter] = useState("all");
  const [productSortBy, setProductSortBy] = useState("name");
  const [productSortOrder, setProductSortOrder] = useState("asc");

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all");

  const [verificationSearch, setVerificationSearch] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role !== "admin") {
      navigate("/login");
      return;
    }
    setAdmin(storedUser);

    fetchDashboard();
    fetchUserNames();
  }, [navigate]);

  const fetchUserNames = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users/admin/users?limit=500");
      const users = response.data.users || [];
      const nameMap = {};
      users.forEach(user => {
        nameMap[user.id] = user.name || user.email;
      });
      setUserNames(nameMap);
    } catch (err) {
      console.error("Failed to fetch user names:", err);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        productsRes,
        usersRes,
        ordersRes,
        verificationsRes,
        statsRes
      ] = await Promise.all([
        axios.get("http://localhost:5000/api/products?limit=100"),
        axios.get("http://localhost:5000/api/users/admin/users?limit=100"),
        axios.get("http://localhost:5000/api/orders?limit=100"),
        axios.get("http://localhost:5000/api/users/admin/verifications/pending"),
        axios.get("http://localhost:5000/api/orders/stats/overview").catch(err => {
          console.log("Stats API error:", err.message);
          return { 
            data: { 
              stats: { 
                today: { count: 0, revenue: 0 },
                monthly: { count: 0, revenue: 0 },
                byStatus: [],
                byPayment: [],
                dailyRevenue: []
              } 
            } 
          };
        })
      ]);

      const allProducts = productsRes.data.products || [];
      const outOfStock = allProducts.filter(p => {
        const stock = p.stock_quantity || p.stock || 0;
        return stock <= 0;
      }).length;

      const lowStock = allProducts.filter(p => {
        const stock = p.stock_quantity || p.stock || 0;
        return stock > 0 && stock <= 10;
      }).length;

      const allUsers = usersRes.data.users || [];
      const allOrders = ordersRes.data.orders || [];
      const totalRevenue = statsRes.data.stats?.monthly?.revenue || 0;
      const pendingVerifs = verificationsRes.data.pendingVerifications || [];

      setStats({
        totalUsers: allUsers.length,
        totalProducts: allProducts.length,
        totalOrders: allOrders.length,
        revenue: totalRevenue,
        pendingVerifications: pendingVerifs.length,
        outOfStock,
        lowStock,
      });

      setProducts(allProducts);
      setUsers(allUsers);
      setOrders(allOrders);
      setPendingVerifications(pendingVerifs);

    } catch (err) {
      console.error("Dashboard fetch error:", err.response?.data || err.message);
      if (err.response?.config?.url?.includes('/api/orders')) {
        setError("Failed to load orders. Make sure you have admin permissions.");
      } else if (err.response?.config?.url?.includes('/api/users')) {
        setError("Failed to load users. Make sure you have admin permissions.");
      } else {
        setError("Failed to load dashboard data: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      setFetchingData(true);
      let url = `http://localhost:5000/api/users/admin/users?page=${page}&limit=${itemsPerPage}`;

      const params = [];
      if (userSearch) params.push(`search=${encodeURIComponent(userSearch)}`);
      if (userRoleFilter && userRoleFilter !== "all") params.push(`role=${userRoleFilter}`);
      if (userStatusFilter && userStatusFilter !== "all") params.push(`status=${userStatusFilter}`);

      if (params.length > 0) {
        url += `&${params.join("&")}`;
      }

      const response = await axios.get(url);
      setUsers(response.data.users || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error("Fetch users error:", err.response?.data || err.message);
      setError("Failed to load users: " + (err.response?.data?.message || err.message));
    } finally {
      setFetchingData(false);
    }
  };

  const fetchProducts = async (page = 1) => {
    try {
      setFetchingData(true);
      let url = `http://localhost:5000/api/products?page=${page}&limit=${itemsPerPage}`;

      const params = [];
      if (productSearch) params.push(`search=${encodeURIComponent(productSearch)}`);
      if (productCategoryFilter && productCategoryFilter !== "all") {
        params.push(`category=${productCategoryFilter}`);
      }
      if (productStockFilter !== "all") {
        params.push(`inStock=${productStockFilter === "inStock"}`);
      }
      params.push(`sortBy=${productSortBy}`);
      params.push(`sortOrder=${productSortOrder}`);

      if (params.length > 0) {
        url += `&${params.join("&")}`;
      }

      const response = await axios.get(url);
      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error("Fetch products error:", err.response?.data || err.message);
      setError("Failed to load products: " + (err.response?.data?.message || err.message));
    } finally {
      setFetchingData(false);
    }
  };

  const fetchOrders = async (page = 1) => {
    try {
      setFetchingData(true);
      let url = `http://localhost:5000/api/orders?page=${page}&limit=${itemsPerPage}`;

      const params = [];
      if (orderSearch) params.push(`search=${encodeURIComponent(orderSearch)}`);
      if (orderStatusFilter && orderStatusFilter !== "all") {
        params.push(`status=${orderStatusFilter}`);
      }
      if (orderTypeFilter && orderTypeFilter !== "all") {
        params.push(`orderType=${orderTypeFilter}`);
      }
      if (orderPaymentFilter && orderPaymentFilter !== "all") {
        params.push(`paymentStatus=${orderPaymentFilter}`);
      }

      if (params.length > 0) {
        url += `&${params.join("&")}`;
      }

      const response = await axios.get(url);
      setOrders(response.data.orders || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error("Fetch orders error:", err.response?.data || err.message);
      setError("Failed to load orders: " + (err.response?.data?.message || err.message));
    } finally {
      setFetchingData(false);
    }
  };

  const fetchVerifications = async () => {
    try {
      setFetchingData(true);
      let url = `http://localhost:5000/api/users/admin/verifications/pending`;

      if (verificationSearch) {
        url += `?search=${encodeURIComponent(verificationSearch)}`;
      }

      const response = await axios.get(url);
      setPendingVerifications(response.data.pendingVerifications || []);
      setTotalItems(response.data.count || 0);
    } catch (err) {
      console.error("Fetch verifications error:", err.response?.data || err.message);
      setError("Failed to load verifications: " + (err.response?.data?.message || err.message));
    } finally {
      setFetchingData(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);

    switch (tab) {
      case "users":
        fetchUsers(1);
        break;
      case "products":
        fetchProducts(1);
        break;
      case "orders":
        fetchOrders(1);
        break;
      case "verifications":
        fetchVerifications();
        break;
      default:
        fetchDashboard();
    }
  };

  const handleUserSearch = () => {
    fetchUsers(1);
  };

  const handleProductSearch = () => {
    fetchProducts(1);
  };

  const handleOrderSearch = () => {
    fetchOrders(1);
  };

  const handleVerificationSearch = () => {
    fetchVerifications();
  };

  const handleProductSort = (field) => {
    if (productSortBy === field) {
      setProductSortOrder(productSortOrder === "asc" ? "desc" : "asc");
    } else {
      setProductSortBy(field);
      setProductSortOrder("asc");
    }
    fetchProducts(1);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setDeleteLoading(true);
      setError("");

      await axios.delete(`http://localhost:5000/api/products/${productToDelete.id}`);

      setSuccess(`Product "${productToDelete.name}" deleted successfully!`);
      setShowDeleteModal(false);
      setProductToDelete(null);

      fetchProducts(currentPage);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Delete product error:", err);
      setError(err.response?.data?.message || "Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
    setError("");
  };

  const handleUserStatus = async (userId, status) => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/admin/users/${userId}`,
        { status }
      );
      fetchUsers(currentPage);
      setSuccess(`User status updated to ${status}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Update user status error:", err);
      setError("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) return;

    try {
      await axios.delete(`http://localhost:5000/api/users/admin/users/${userId}`);
      fetchUsers(currentPage);
      setSuccess(`User "${userName}" deleted successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Delete user error:", err);
      setError("Failed to delete user");
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}`,
        { orderStatus: status }
      );
      fetchOrders(currentPage);
      setSuccess(`Order status updated to ${status}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Update order status error:", err);
      setError("Failed to update order status. The endpoint might not exist.");
    }
  };

  const handleVerification = async (userId, status, comments = "") => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/admin/verifications/${userId}/status`,
        { status, comments }
      );
      fetchVerifications();
      setSuccess(`Verification ${status} successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Update verification error:", err);
      setError("Failed to update verification");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const getStockQuantity = (product) => {
    return product.stock_quantity || product.stock || 0;
  };

  const getSortIcon = (field) => {
    if (productSortBy !== field) return <FaSort className="ms-1" />;
    return productSortOrder === "asc" ?
      <FaSortUp className="ms-1" /> :
      <FaSortDown className="ms-1" />;
  };

  if (!admin || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <Container fluid className="p-0">
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {productToDelete && (
            <>
              <p>Are you sure you want to delete the product:</p>
              <h5 className="text-danger">"{productToDelete.name}"?</h5>
              <p className="text-muted">This action cannot be undone.</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteProduct} disabled={deleteLoading}>
            {deleteLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                Delete Product
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Row className="g-0">
        <Col md={2} className="bg-dark text-white vh-100 p-3 d-flex flex-column">
          <div className="text-center mb-4">
            <h4 className="mb-0">Admin Panel</h4>
            <small className="text-muted">Smart Stationery</small>
          </div>

          <div className="text-center mb-3 p-2 bg-dark rounded">
            <p className="mb-0 fw-bold">{admin.name}</p>
            <small className="text-muted">{admin.email}</small>
            <Badge bg="danger" className="ms-2">Admin</Badge>
          </div>

          <Nav className="flex-column mt-2">
            <Nav.Link
              onClick={() => handleTabChange("dashboard")}
              className={`text-white mb-2 d-flex align-items-center ${activeTab === "dashboard" ? "bg-primary rounded" : ""}`}
            >
              <FaChartLine className="me-2" />
              Dashboard
            </Nav.Link>
            <Nav.Link
              onClick={() => handleTabChange("users")}
              className={`text-white mb-2 d-flex align-items-center ${activeTab === "users" ? "bg-primary rounded" : ""}`}
            >
              <FaUsers className="me-2" />
              Users
              <Badge bg="info" className="ms-auto">
                {stats.totalUsers}
              </Badge>
            </Nav.Link>
            <Nav.Link
              onClick={() => handleTabChange("products")}
              className={`text-white mb-2 d-flex align-items-center ${activeTab === "products" ? "bg-primary rounded" : ""}`}
            >
              <FaBox className="me-2" />
              Products
              <Badge bg="warning" className="ms-auto">
                {stats.totalProducts}
              </Badge>
            </Nav.Link>
            <Nav.Link
              onClick={() => handleTabChange("orders")}
              className={`text-white mb-2 d-flex align-items-center ${activeTab === "orders" ? "bg-primary rounded" : ""}`}
            >
              <FaShoppingCart className="me-2" />
              Orders
              <Badge bg="info" className="ms-auto">
                {stats.totalOrders}
              </Badge>
            </Nav.Link>
            <Nav.Link
              onClick={() => handleTabChange("verifications")}
              className={`text-white mb-2 d-flex align-items-center ${activeTab === "verifications" ? "bg-primary rounded" : ""}`}
            >
              <FaUserCheck className="me-2" />
              Verifications
              {stats.pendingVerifications > 0 && (
                <Badge bg="danger" className="ms-auto">
                  {stats.pendingVerifications}
                </Badge>
              )}
            </Nav.Link>
            <Button
              variant="outline-danger"
              className="mt-auto d-flex align-items-center justify-content-center"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="me-2" />
              Logout
            </Button>
          </Nav>
        </Col>

        <Col md={10} className="p-4">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              <strong>Error:</strong> {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}

          {activeTab === "dashboard" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">
                  <FaChartLine className="me-2" />
                  Dashboard Overview
                </h3>
                <Button variant="outline-primary" size="sm" onClick={fetchDashboard}>
                  <FaSync className="me-1" />
                  Refresh
                </Button>
              </div>

              <Row className="g-4 mb-4">
                <Col sm={6} md={3}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="text-center">
                      <FaUsers className="fs-1 text-primary mb-2" />
                      <Card.Title>Total Users</Card.Title>
                      <Card.Text className="fs-3 fw-bold">{stats.totalUsers}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm={6} md={3}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="text-center">
                      <FaBox className="fs-1 text-success mb-2" />
                      <Card.Title>Total Products</Card.Title>
                      <Card.Text className="fs-3 fw-bold">{stats.totalProducts}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm={6} md={3}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="text-center">
                      <FaShoppingCart className="fs-1 text-warning mb-2" />
                      <Card.Title>Total Orders</Card.Title>
                      <Card.Text className="fs-3 fw-bold">{stats.totalOrders}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm={6} md={3}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body className="text-center">
                      <FaRupeeSign className="fs-1 text-info mb-2" />
                      <Card.Title>Total Revenue</Card.Title>
                      <Card.Text className="fs-3 fw-bold">₹{stats.revenue.toLocaleString()}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-4 mb-4">
                <Col md={4}>
                  <Card className="shadow-sm border-0 h-100 bg-light">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <Card.Title>Out of Stock</Card.Title>
                          <Card.Text className="fs-2 fw-bold text-danger">{stats.outOfStock}</Card.Text>
                          <small className="text-muted">Products with zero stock</small>
                        </div>
                        <FaExclamationTriangle className="fs-1 text-danger" />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="shadow-sm border-0 h-100 bg-light">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <Card.Title>Low Stock</Card.Title>
                          <Card.Text className="fs-2 fw-bold text-warning">{stats.lowStock}</Card.Text>
                          <small className="text-muted">Products with ≤ 10 stock</small>
                        </div>
                        <FaExclamationTriangle className="fs-1 text-warning" />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="shadow-sm border-0 h-100 bg-light">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <Card.Title>Pending Verifications</Card.Title>
                          <Card.Text className="fs-2 fw-bold text-primary">{stats.pendingVerifications}</Card.Text>
                          <small className="text-muted">Institute verifications pending</small>
                        </div>
                        <FaUserCheck className="fs-1 text-primary" />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {activeTab === "users" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">
                  <FaUsers className="me-2" />
                  Users Management
                </h3>
                <Badge bg="info">Total: {totalItems}</Badge>
              </div>

              <Card className="mb-4 shadow-sm">
                <Card.Body>
                  <Row className="g-3">
                    <Col md={5}>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Search users by name, email, phone, or address..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
                        />
                        <Button variant="primary" onClick={handleUserSearch}>
                          Search
                        </Button>
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={userRoleFilter}
                        onChange={(e) => {
                          setUserRoleFilter(e.target.value);
                          fetchUsers(1);
                        }}
                      >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="institute">Institute</option>
                        <option value="personal">Personal</option>
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={userStatusFilter}
                        onChange={(e) => {
                          setUserStatusFilter(e.target.value);
                          fetchUsers(1);
                        }}
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </Form.Select>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {fetchingData ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading users...</p>
                </div>
              ) : users.length > 0 ? (
                <>
                  <Card className="shadow-sm border-0">
                    <Card.Body className="p-0">
                      <Table striped hover responsive className="mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Verified</th>
                            <th>Phone</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td>{user.name || "N/A"}</td>
                              <td>{user.email}</td>
                              <td>
                                <Badge bg={
                                  user.role === "admin" ? "danger" :
                                    user.role === "institute" ? "primary" : "secondary"
                                }>
                                  {user.role}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={user.status === "active" ? "success" : "warning"}>
                                  {user.status || "active"}
                                </Badge>
                              </td>
                              <td>
                                {user.isVerified ? (
                                  <Badge bg="success">Yes</Badge>
                                ) : (
                                  <Badge bg="warning">No</Badge>
                                )}
                              </td>
                              <td>{user.phone || "N/A"}</td>
                              <td>
                                <Button
                                  variant={user.status === "active" ? "warning" : "success"}
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleUserStatus(user.id, user.status === "active" ? "suspended" : "active")}
                                >
                                  {user.status === "active" ? "Suspend" : "Activate"}
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                >
                                  <FaTrash />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>

                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <Pagination>
                        <Pagination.First onClick={() => fetchUsers(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => fetchUsers(currentPage - 1)} disabled={currentPage === 1} />
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                          ) {
                            return (
                              <Pagination.Item
                                key={`page-${pageNum}`}
                                active={pageNum === currentPage}
                                onClick={() => fetchUsers(pageNum)}
                              >
                                {pageNum}
                              </Pagination.Item>
                            );
                          } else if (
                            pageNum === currentPage - 3 ||
                            pageNum === currentPage + 3
                          ) {
                            return <Pagination.Ellipsis key={`ellipsis-${pageNum}`} />;
                          }
                          return null;
                        })}
                        <Pagination.Next onClick={() => fetchUsers(currentPage + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => fetchUsers(totalPages)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <Alert variant="info">
                  No users found matching your search criteria.
                </Alert>
              )}
            </>
          )}

          {activeTab === "products" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">
                  <FaBox className="me-2" />
                  Products Management
                </h3>
                <div>
                  <Badge bg="danger" className="me-2">Out of Stock: {stats.outOfStock}</Badge>
                  <Badge bg="warning" className="me-2">Low Stock: {stats.lowStock}</Badge>
                  <Button variant="primary" onClick={() => navigate("/admin/add-product")}>
                    <FaPlus className="me-2" />
                    Add New Product
                  </Button>
                </div>
              </div>

              <Card className="mb-4 shadow-sm">
                <Card.Body>
                  <Row className="g-3">
                    <Col md={4}>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Search by name, category, author, genre..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleProductSearch()}
                        />
                        <Button variant="primary" onClick={handleProductSearch}>
                          Search
                        </Button>
                      </InputGroup>
                    </Col>
                    <Col md={2}>
                      <Form.Select
                        value={productCategoryFilter}
                        onChange={(e) => {
                          setProductCategoryFilter(e.target.value);
                          fetchProducts(1);
                        }}
                      >
                        <option value="all">All Categories</option>
                        <option value="book">Books</option>
                        <option value="stationery">Stationery</option>
                      </Form.Select>
                    </Col>
                    <Col md={2}>
                      <Form.Select
                        value={productStockFilter}
                        onChange={(e) => {
                          setProductStockFilter(e.target.value);
                          fetchProducts(1);
                        }}
                      >
                        <option value="all">All Stock</option>
                        <option value="inStock">In Stock</option>
                        <option value="outOfStock">Out of Stock</option>
                      </Form.Select>
                    </Col>
                    <Col md={2}>
                      <Form.Select
                        value={productSortBy}
                        onChange={(e) => {
                          setProductSortBy(e.target.value);
                          fetchProducts(1);
                        }}
                      >
                        <option value="name">Sort by Name</option>
                        <option value="price">Sort by Price</option>
                        <option value="stock_quantity">Sort by Stock</option>
                        <option value="created_at">Sort by Date</option>
                      </Form.Select>
                    </Col>
                    <Col md={2}>
                      <Button
                        variant={productSortOrder === "asc" ? "outline-primary" : "outline-secondary"}
                        onClick={() => {
                          setProductSortOrder(productSortOrder === "asc" ? "desc" : "asc");
                          fetchProducts(1);
                        }}
                        className="w-100"
                      >
                        {productSortOrder === "asc" ? "Ascending" : "Descending"}
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {fetchingData ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading products...</p>
                </div>
              ) : products.length > 0 ? (
                <>
                  <Card className="shadow-sm border-0">
                    <Card.Body className="p-0">
                      <Table striped hover responsive className="mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleProductSort("name")}
                            >
                              Name {getSortIcon("name")}
                            </th>
                            <th
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleProductSort("category")}
                            >
                              Category {getSortIcon("category")}
                            </th>
                            <th
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleProductSort("price")}
                            >
                              Price (₹) {getSortIcon("price")}
                            </th>
                            <th
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleProductSort("stock_quantity")}
                            >
                              Stock {getSortIcon("stock_quantity")}
                            </th>
                            <th>Author/Type</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product) => {
                            const stock = getStockQuantity(product);
                            return (
                              <tr key={product.id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    {product.image_url && (
                                      <img
                                        src={product.image_url}
                                        alt={product.name}
                                        style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px' }}
                                        onError={(e) => e.target.style.display = 'none'}
                                      />
                                    )}
                                    <span>{product.name}</span>
                                  </div>
                                </td>
                                <td>
                                  <Badge bg={product.category === "book" ? "info" : "primary"}>
                                    {product.category}
                                  </Badge>
                                </td>
                                <td>₹{product.price}</td>
                                <td>
                                  <Badge bg={stock > 10 ? "success" : stock > 0 ? "warning" : "danger"}>
                                    {stock}
                                  </Badge>
                                </td>
                                <td>
                                  {product.category === "book" ? product.author || "N/A" : "Stationery"}
                                </td>
                                <td>
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => navigate(`/admin/edit-product/${product.id}`)}
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => confirmDeleteProduct(product)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>

                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <Pagination>
                        <Pagination.First onClick={() => fetchProducts(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => fetchProducts(currentPage - 1)} disabled={currentPage === 1} />
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                          ) {
                            return (
                              <Pagination.Item
                                key={`page-${pageNum}`}
                                active={pageNum === currentPage}
                                onClick={() => fetchProducts(pageNum)}
                              >
                                {pageNum}
                              </Pagination.Item>
                            );
                          } else if (
                            pageNum === currentPage - 3 ||
                            pageNum === currentPage + 3
                          ) {
                            return <Pagination.Ellipsis key={`ellipsis-${pageNum}`} />;
                          }
                          return null;
                        })}
                        <Pagination.Next onClick={() => fetchProducts(currentPage + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => fetchProducts(totalPages)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <Alert variant="info">
                  No products found matching your search criteria. <Button variant="link" onClick={() => navigate("/admin/add-product")}>Add your first product</Button>
                </Alert>
              )}
            </>
          )}

          {activeTab === "orders" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">
                  <FaShoppingCart className="me-2" />
                  Orders Management
                </h3>
                <Badge bg="info">Total: {totalItems}</Badge>
              </div>

              <Card className="mb-4 shadow-sm">
                <Card.Body>
                  <Row className="g-3">
                    <Col md={4}>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Search by Order ID, customer name, email, phone..."
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleOrderSearch()}
                        />
                        <Button variant="primary" onClick={handleOrderSearch}>
                          Search
                        </Button>
                      </InputGroup>
                    </Col>
                    <Col md={2}>
                      <Form.Select
                        value={orderStatusFilter}
                        onChange={(e) => {
                          setOrderStatusFilter(e.target.value);
                          fetchOrders(1);
                        }}
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </Form.Select>
                    </Col>
                    <Col md={2}>
                      <Form.Select
                        value={orderTypeFilter}
                        onChange={(e) => {
                          setOrderTypeFilter(e.target.value);
                          fetchOrders(1);
                        }}
                      >
                        <option value="all">All Types</option>
                        <option value="regular">Regular</option>
                        <option value="bulk">Bulk</option>
                      </Form.Select>
                    </Col>
                    <Col md={2}>
                      <Form.Select
                        value={orderPaymentFilter}
                        onChange={(e) => {
                          setOrderPaymentFilter(e.target.value);
                          fetchOrders(1);
                        }}
                      >
                        <option value="all">All Payment</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                      </Form.Select>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {fetchingData ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading orders...</p>
                </div>
              ) : orders.length > 0 ? (
                <>
                  <Card className="shadow-sm border-0">
                    <Card.Body className="p-0">
                      <Table striped hover responsive className="mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount (₹)</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => {
                            const customer = userNames[order.user] || `User ID: ${order.user || "N/A"}`;
                            const amount = order.totalAmount || order.total_amount || 0;
                            const status = order.orderStatus || "pending";
                            const payment = order.paymentStatus || "pending";
                            const date = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "N/A";
                            const type = order.orderType || "regular";

                            return (
                              <tr key={order.id}>
                                <td>
                                  <small className="text-muted" title={`ORD-${order.id}`}>
                                    <FaIdCard className="me-1" />
                                    ORD-{order.id}
                                  </small>
                                </td>
                                <td>{customer}</td>
                                <td>₹{amount}</td>
                                <td>
                                  <Badge bg={
                                    status === "delivered" ? "success" :
                                      status === "pending" ? "warning" :
                                        status === "cancelled" ? "danger" :
                                          status === "processing" ? "primary" : "info"
                                  }>
                                    {status}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge bg={payment === "completed" ? "success" : "warning"}>
                                    {payment}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge bg={type === "bulk" ? "primary" : "secondary"}>
                                    {type}
                                  </Badge>
                                </td>
                                <td>{date}</td>
                                <td>
                                  <Button
                                    variant="info"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                  >
                                    <FaEye />
                                  </Button>
                                  <select
                                    className="form-select form-select-sm"
                                    style={{ width: '120px' }}
                                    value={status}
                                    onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>

                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <Pagination>
                        <Pagination.First onClick={() => fetchOrders(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => fetchOrders(currentPage - 1)} disabled={currentPage === 1} />
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                          ) {
                            return (
                              <Pagination.Item
                                key={`page-${pageNum}`}
                                active={pageNum === currentPage}
                                onClick={() => fetchOrders(pageNum)}
                              >
                                {pageNum}
                              </Pagination.Item>
                            );
                          } else if (
                            pageNum === currentPage - 3 ||
                            pageNum === currentPage + 3
                          ) {
                            return <Pagination.Ellipsis key={`ellipsis-${pageNum}`} />;
                          }
                          return null;
                        })}
                        <Pagination.Next onClick={() => fetchOrders(currentPage + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => fetchOrders(totalPages)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <Alert variant="info">
                  No orders found matching your search criteria.
                </Alert>
              )}
            </>
          )}

          {activeTab === "verifications" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">
                  <FaUserCheck className="me-2" />
                  Institute Verifications
                </h3>
                <Badge bg="danger">Pending: {totalItems}</Badge>
              </div>

              <Card className="mb-4 shadow-sm">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Search by institute name, school name, contact person..."
                          value={verificationSearch}
                          onChange={(e) => setVerificationSearch(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleVerificationSearch()}
                        />
                        <Button variant="primary" onClick={handleVerificationSearch}>
                          Search
                        </Button>
                      </InputGroup>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {fetchingData ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading verifications...</p>
                </div>
              ) : pendingVerifications.length > 0 ? (
                <Card className="shadow-sm border-0">
                  <Card.Body>
                    <Table striped hover responsive>
                      <thead className="table-dark">
                        <tr>
                          <th>Institute Name</th>
                          <th>Contact Person</th>
                          <th>Email</th>
                          <th>Contact Number</th>
                          <th>School Name</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingVerifications.map((user) => {
                          const instituteName = user.instituteVerification?.instituteName ||
                            user.instituteInfo?.schoolName ||
                            user.instituteName ||
                            "N/A";
                          const contactNumber = user.instituteVerification?.contactNumber ||
                            user.instituteInfo?.phone ||
                            user.phone ||
                            "N/A";
                          const schoolName = user.instituteInfo?.schoolName || "N/A";

                          return (
                            <tr key={user.id}>
                              <td>{instituteName}</td>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>{contactNumber}</td>
                              <td>{schoolName}</td>
                              <td>
                                <Badge bg="warning">Pending</Badge>
                              </td>
                              <td>
                                <Button
                                  variant="success"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleVerification(user.id, "approved")}
                                >
                                  <FaCheckCircle className="me-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => {
                                    const comments = prompt("Enter rejection reason:");
                                    if (comments !== null) {
                                      handleVerification(user.id, "rejected", comments);
                                    }
                                  }}
                                >
                                  Reject
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              ) : (
                <Alert variant="success">
                  <FaCheckCircle className="me-2" />
                  {verificationSearch ?
                    "No verifications found matching your search criteria." :
                    "All verifications have been processed. No pending verifications."
                  }
                </Alert>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;