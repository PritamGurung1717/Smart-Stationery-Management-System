import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Nav,
  Button,
  Form,
  Table,
  Badge,
  Spinner,
  InputGroup,
  Alert,
} from "react-bootstrap";
import BookSetSection from "../components/BookSetSection.jsx";

const InstituteDashboard = ({ setUser }) => {
  const navigate = useNavigate();
  const [user, setLocalUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [verificationStatus, setVerificationStatus] = useState("pending");

  const categories = ["all", "book", "stationery"];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    
    if (!storedUser) {
      navigate("/login");
      return;
    }

    if (storedUser.role !== "institute") {
      navigate("/dashboard");
      return;
    }

    setLocalUser(storedUser);
    setVerificationStatus(storedUser.instituteVerification?.status || "pending");
    
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    fetchDashboardData(storedUser);
  }, [navigate]);

  const fetchDashboardData = async (userData) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch products
      const productsRes = await axios.get("http://localhost:5000/api/products", { headers });
      setProducts(productsRes.data.products || []);
      
      // Fetch institute's own orders using my-orders endpoint
      try {
        const ordersRes = await axios.get("http://localhost:5000/api/orders/my-orders", { headers });
        setOrders(ordersRes.data.orders || []);
      } catch (orderError) {
        console.log("Could not fetch orders:", orderError.response?.data?.message || orderError.message);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, quantity) => {
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: Math.max(1, quantity) }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDiscountedTotal = () => {
    const total = getCartTotal();
    return total * 0.9; // 10% discount for institutes
  };

  const handlePlaceBulkOrder = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    try {
      const orderData = {
        products: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        orderType: "bulk"
      };

      await axios.post("http://localhost:5000/api/orders", orderData);
      alert("Bulk order placed successfully!");
      setCart([]);
      fetchDashboardData(user);
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order: " + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmitVerification = async () => {
    try {
      // Navigate to verification page or show modal
      navigate("/institute-verification");
    } catch (error) {
      console.error("Verification error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!user) return null;

  // Check if institute is verified
  if (verificationStatus !== "approved") {
    return (
      <Container className="py-5">
        <Card className="text-center py-5">
          <Card.Body>
            <div className="mb-4" style={{ fontSize: "4rem" }}>🏫</div>
            <h3>Institute Verification Required</h3>
            <p className="text-muted mb-4">
              Your institute account is {verificationStatus === "pending" ? "pending verification" : "rejected"}.
              Please complete the verification process to access all features.
            </p>
            {verificationStatus === "rejected" && user.instituteVerification?.comments && (
              <Alert variant="danger" className="mb-4">
                <strong>Rejection Reason:</strong> {user.instituteVerification.comments}
              </Alert>
            )}
            <Button variant="primary" size="lg" onClick={handleSubmitVerification}>
              {verificationStatus === "pending" ? "Check Status" : "Resubmit Verification"}
            </Button>
            <Button variant="outline-secondary" className="ms-2" size="lg" onClick={handleLogout}>
              Logout
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const renderDashboard = () => (
    <>
      <h2>Welcome, {user.name}!</h2>
      <p>{user.instituteInfo?.schoolName || "Institute Dashboard"}</p>
      <Badge bg="success" className="mb-3">
        Verified Institute
      </Badge>

      {/* Stats cards */}
      <Row className="g-3 mt-3">
        <Col md={4}>
          <Card className="text-center shadow-sm p-3">
            <Card.Title>Pending Orders</Card.Title>
            <Card.Text className="fs-4">
              {orders.filter((o) => o.orderStatus === "pending").length}
            </Card.Text>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm p-3">
            <Card.Title>Total Spent</Card.Title>
            <Card.Text className="fs-4">
              ₹{orders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
            </Card.Text>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm p-3">
            <Card.Title>Cart Items</Card.Title>
            <Card.Text className="fs-4">{cart.length}</Card.Text>
          </Card>
        </Col>
      </Row>

      {/* Quick actions */}
      <h4 className="mt-4">Quick Actions</h4>
      <Row className="g-3 mt-2">
        <Col xs={6} md={3}>
          <Button
            variant="outline-primary"
            className="w-100"
            onClick={() => navigate("/institute/book-set-request")}
          >
            📚 Book Set Request
          </Button>
        </Col>
        <Col xs={6} md={3}>
          <Button
            variant="outline-primary"
            className="w-100"
            onClick={() => navigate("/book-sets")}
          >
            📖 Browse Book Sets
          </Button>
        </Col>
        <Col xs={6} md={3}>
          <Button
            variant="outline-primary"
            className="w-100"
            onClick={() => setActiveTab("bulk-order")}
          >
            📦 Bulk Order
          </Button>
        </Col>
        <Col xs={6} md={3}>
          <Button
            variant="outline-primary"
            className="w-100"
            onClick={() => setActiveTab("orders")}
          >
            📋 Orders
          </Button>
        </Col>
        <Col xs={6} md={3}>
          <Button
            variant="outline-primary"
            className="w-100"
            onClick={() => navigate("/cart")}
          >
            🛒 View Cart
          </Button>
        </Col>
      </Row>

      {/* Book Set Section */}
      <div className="mt-4">
        <BookSetSection />
      </div>
    </>
  );

  const renderBulkOrder = () => (
    <>
      <h3>Bulk Order Products</h3>
      <Alert variant="info" className="mb-3">
        <strong>Institute Discount:</strong> You get 10% off on all bulk orders!
      </Alert>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card className="p-3 mb-3">
          <Card.Title>
            🛒 Bulk Order Cart <Badge bg="primary">{cart.length}</Badge>
          </Card.Title>
          <Table responsive>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    <InputGroup size="sm" style={{ width: "120px" }}>
                      <Button 
                        variant="outline-secondary"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <Form.Control
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 1)}
                        style={{ textAlign: "center" }}
                      />
                      <Button 
                        variant="outline-secondary"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </InputGroup>
                  </td>
                  <td>₹{item.price}</td>
                  <td>₹{item.price * item.quantity}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="mt-3">
            <Row>
              <Col>
                <h5>Subtotal: ₹{getCartTotal()}</h5>
                <h5 className="text-success">Discount (10%): -₹{(getCartTotal() * 0.1).toFixed(2)}</h5>
                <h4>Total: ₹{getDiscountedTotal().toFixed(2)}</h4>
              </Col>
              <Col className="text-end">
                <Button variant="success" onClick={handlePlaceBulkOrder}>
                  Place Bulk Order
                </Button>
              </Col>
            </Row>
          </div>
        </Card>
      )}

      {/* Products */}
      <div className="mt-4">
        <h5>Filter by Category</h5>
        <Nav className="flex-wrap mb-3">
          {categories.map((cat) => (
            <Nav.Link
              key={cat}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Nav.Link>
          ))}
        </Nav>
      </div>

      <Row className="g-3 mt-2">
        {products
          .filter(p => selectedCategory === "all" || p.category === selectedCategory)
          .map((product) => (
            <Col xs={12} md={6} lg={4} key={product.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column">
                  {product.image && (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      style={{ height: "150px", objectFit: "contain", marginBottom: "10px" }}
                    />
                  )}
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {product.category}
                  </Card.Subtitle>
                  <Card.Text className="mb-1">
                    ₹{product.price} per unit
                  </Card.Text>
                  <Card.Text className="mb-2">
                    <Badge bg={product.stock > 0 ? "success" : "danger"}>
                      Stock: {product.stock}
                    </Badge>
                  </Card.Text>
                  <Button
                    variant="primary"
                    className="mb-2"
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                  >
                    Add to Bulk Cart
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
      </Row>
    </>
  );

  const renderOrders = () => (
    <>
      <h3>Your Orders</h3>
      {orders.length === 0 ? (
        <Card className="p-3 mt-3">
          <p className="text-muted mb-2">No orders placed yet.</p>
          <Button
            variant="primary"
            onClick={() => setActiveTab("bulk-order")}
          >
            Place Your First Order
          </Button>
        </Card>
      ) : (
        <Table
          striped
          bordered
          hover
          responsive
          className="mt-3 shadow-sm"
        >
          <thead className="table-dark">
            <tr>
              <th>Order Date</th>
              <th>Order ID</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  {new Date(order.orderDate).toLocaleDateString()}
                </td>
                <td>{order.id.substring(0, 8)}...</td>
                <td>₹{order.totalAmount}</td>
                <td>
                  <Badge
                    bg={
                      order.orderStatus === "delivered" ? "success" :
                      order.orderStatus === "pending" ? "warning" :
                      order.orderStatus === "cancelled" ? "danger" : "info"
                    }
                  >
                    {order.orderStatus}
                  </Badge>
                </td>
                <td>
                  <Badge bg={order.orderType === "bulk" ? "primary" : "secondary"}>
                    {order.orderType}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );

  return (
    <Container fluid className="p-0">
      {/* Top navbar */}
      <Nav
        bg="dark"
        variant="dark"
        className="px-3 py-2 d-flex justify-content-between"
      >
        <Nav.Item className="text-white fw-bold fs-5">
          ✏️ Smart Stationery
        </Nav.Item>
        <Nav.Item className="d-flex align-items-center">
          <span className="me-3">
            Welcome, {user.name} (Institute)
          </span>
          <Button variant="outline-light" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </Nav.Item>
      </Nav>

      <Row className="g-0">
        {/* Sidebar */}
        <Col
          md={2}
          className="bg-light vh-100 p-3 border-end"
          style={{ minHeight: "100vh" }}
        >
          <Nav className="flex-column">
            <Nav.Link
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            >
              📊 Dashboard
            </Nav.Link>
            <Nav.Link
              onClick={() => navigate("/institute/book-set-request")}
            >
              📚 Book Set Request
            </Nav.Link>
            <Nav.Link
              onClick={() => navigate("/book-sets")}
            >
              📖 Browse Book Sets
            </Nav.Link>
            <Nav.Link
              active={activeTab === "bulk-order"}
              onClick={() => setActiveTab("bulk-order")}
            >
              📦 Bulk Order
            </Nav.Link>
            <Nav.Link
              active={activeTab === "orders"}
              onClick={() => setActiveTab("orders")}
            >
              📋 Orders
            </Nav.Link>
            <Nav.Link
              onClick={() => navigate("/cart")}
            >
              🛒 View Cart
            </Nav.Link>
          </Nav>

          <div className="mt-4">
            <h6>Quick Stats</h6>
            <p className="mb-1">
              Pending Orders:{" "}
              <strong>
                {orders.filter((o) => o.orderStatus === "pending").length}
              </strong>
            </p>
            <p className="mb-1">
              Cart Items: <strong>{cart.length}</strong>
            </p>
          </div>
        </Col>

        {/* Main area */}
        <Col md={10} className="p-4">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "bulk-order" && renderBulkOrder()}
          {activeTab === "orders" && renderOrders()}
        </Col>
      </Row>
    </Container>
  );
};

export default InstituteDashboard;