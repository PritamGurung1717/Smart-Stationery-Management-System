import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge, Nav, Table, Spinner, Form, Alert } from "react-bootstrap";
import axios from "axios";
import { FaExclamationTriangle, FaShoppingCart, FaBox, FaUserCheck, FaHistory } from "react-icons/fa";

const Dashboard = ({ setUser }) => {
  const navigate = useNavigate();
  const [user, setLocalUser] = useState(null);
  const [cart, setCart] = useState({ items: [] });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [error, setError] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(true);

  const categories = ["all", "book", "stationery", "electronics", "sports"];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    
    if (!storedUser) {
      navigate("/login");
      return;
    }

    if (storedUser.role === "admin") {
      navigate("/admin-dashboard");
      return;
    }

    if (storedUser.role === "institute") {
      navigate("/institute-dashboard");
      return;
    }

    setLocalUser(storedUser);
    
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view dashboard");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`
      };

      // Fetch products and cart
      const [productsRes, cartRes] = await Promise.all([
        axios.get("http://localhost:5000/api/products?limit=8", { headers })
          .catch(err => {
            console.error("Products fetch error:", err.message);
            return { data: { products: [] } };
          }),
        axios.get("http://localhost:5000/api/users/cart", { headers })
          .catch(err => {
            console.error("Cart fetch error:", err.message);
            return { data: { cart: { items: [] } } };
          })
      ]);

      setProducts(productsRes.data.products || []);
      setCart(cartRes.data.cart || { items: [] });
      
      // Fetch orders separately with better error handling
      setOrdersLoading(true);
      try {
        console.log("Fetching user orders...");
        const ordersRes = await axios.get("http://localhost:5000/api/orders/my-orders?limit=5", { headers });
        console.log("Orders response:", ordersRes.data);
        setOrders(ordersRes.data.orders || []);
      } catch (ordersError) {
        console.error("Orders fetch error:", ordersError.response?.data || ordersError.message);
        
        // If /my-orders doesn't exist, try fallback
        if (ordersError.response?.status === 404 || ordersError.response?.status === 400) {
          console.log("Trying fallback: fetching all orders filtered by user...");
          try {
            // Fallback: Get all orders and filter by user ID
            const allOrdersRes = await axios.get("http://localhost:5000/api/orders", { headers });
            if (allOrdersRes.data.orders && user) {
              // Filter orders for current user
              const userOrders = allOrdersRes.data.orders.filter(order => 
                order.user === user.id || order.userDetails?.id === user.id
              );
              setOrders(userOrders.slice(0, 5));
            }
          } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError.message);
            setOrders([]);
            setError("Could not load your orders. Please try again later.");
          }
        } else {
          setOrders([]);
        }
      } finally {
        setOrdersLoading(false);
      }
      
      // Initialize quantities
      const initialQuantities = {};
      productsRes.data.products?.forEach(product => {
        initialQuantities[product.id] = 1;
      });
      setQuantities(initialQuantities);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) {
        alert("Product not found!");
        return;
      }
      
      if (quantity > product.stock) {
        alert(`Only ${product.stock} items available in stock!`);
        setQuantities(prev => ({ ...prev, [productId]: product.stock }));
        return;
      }
      
      if (quantity < 1) {
        alert("Quantity must be at least 1!");
        setQuantities(prev => ({ ...prev, [productId]: 1 }));
        return;
      }
      
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/users/cart/add", {
        productId: productId,
        quantity: quantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh cart
      const cartRes = await axios.get("http://localhost:5000/api/users/cart", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(cartRes.data.cart || { items: [] });
      
      alert(`Added ${quantity} item(s) to cart successfully!`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Failed to add to cart");
      }
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/users/cart/remove/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh cart
      const cartRes = await axios.get("http://localhost:5000/api/users/cart", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(cartRes.data.cart || { items: [] });
      
      alert("Product removed from cart!");
    } catch (error) {
      console.error("Error removing from cart:", error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    }
  };

  const getCartTotal = () => {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.items.reduce((count, item) => count + item.quantity, 0);
  };

  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login", { replace: true });
  };

  const handleQuantityChange = (productId, value) => {
    const quantity = parseInt(value) || 1;
    const product = products.find(p => p.id === productId);
    
    if (product) {
      if (quantity > product.stock) {
        alert(`Only ${product.stock} items available!`);
        setQuantities(prev => ({ ...prev, [productId]: product.stock }));
        return;
      }
      if (quantity < 1) {
        setQuantities(prev => ({ ...prev, [productId]: 1 }));
        return;
      }
    }
    
    setQuantities(prev => ({ ...prev, [productId]: quantity }));
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </Container>
    );
  }

  if (!user) return null;

  return (
    <Container fluid>
      <Row>
        <Col md={2} className="bg-light vh-100 p-3 d-flex flex-column">
          <h4 className="text-center mb-4">Categories</h4>
          <Nav className="flex-column">
            {categories.map(cat => (
              <Nav.Link
                key={cat}
                active={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className="mb-1"
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Nav.Link>
            ))}
          </Nav>

          <div className="mt-auto">
            <h5 className="mt-4">
              <FaShoppingCart className="me-2" />
              Cart <Badge bg="primary">{getCartItemCount()}</Badge>
            </h5>
            {cart.items.length === 0 ? (
              <p className="small text-muted">Your cart is empty</p>
            ) : (
              <div>
                {cart.items.slice(0, 3).map((item, index) => (
                  <div 
                    key={item.product || `cart-item-${index}`}
                    className="d-flex justify-content-between align-items-center mb-1"
                  >
                    <span className="text-truncate" style={{ maxWidth: "100px" }}>
                      Product ID: {item.product}
                    </span>
                    <span>×{item.quantity}</span>
                    <Button 
                      size="sm" 
                      variant="danger" 
                      onClick={() => removeFromCart(item.product)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <div className="mt-2">
                  <strong>Total: ₹{getCartTotal()}</strong>
                  <Button 
                    variant="success" 
                    size="sm" 
                    className="w-100 mt-2"
                    onClick={() => navigate("/cart")}
                  >
                    View Cart
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button variant="danger" className="mt-4 w-100" onClick={handleLogout}>
            Logout
          </Button>
        </Col>

        <Col md={10} className="p-4">
          <div className="mb-4">
            <h2>Welcome, {user.name}!</h2>
            <p className="text-muted">Personal Account Dashboard</p>
          </div>

          {error && (
            <Alert variant="warning" className="mb-3">
              <FaExclamationTriangle className="me-2" />
              {error}
            </Alert>
          )}

          <Row className="g-3 mb-4">
            <Col sm={6} md={3}>
              <Card className="text-center p-3 shadow-sm border-0 bg-primary bg-opacity-10">
                <Card.Title className="text-primary">
                  <FaShoppingCart className="me-2" />
                  Cart Items
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">{getCartItemCount()}</Card.Text>
              </Card>
            </Col>
            <Col sm={6} md={3}>
              <Card className="text-center p-3 shadow-sm border-0 bg-info bg-opacity-10">
                <Card.Title className="text-info">
                  <FaBox className="me-2" />
                  Total Products
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">{products.length}</Card.Text>
              </Card>
            </Col>
            <Col sm={6} md={3}>
              <Card className="text-center p-3 shadow-sm border-0 bg-success bg-opacity-10">
                <Card.Title className="text-success">
                  <FaHistory className="me-2" />
                  Orders
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">{orders.length}</Card.Text>
              </Card>
            </Col>
            <Col sm={6} md={3}>
              <Card className="text-center p-3 shadow-sm border-0 bg-warning bg-opacity-10">
                <Card.Title className="text-warning">
                  <FaUserCheck className="me-2" />
                  Account Status
                </Card.Title>
                <Card.Text>
                  <Badge bg={user.isVerified ? "success" : "warning"} className="fs-6 px-3 py-2">
                    {user.isVerified ? "Verified" : "Unverified"}
                  </Badge>
                </Card.Text>
              </Card>
            </Col>
          </Row>

          <h4 className="mt-4">Recent Orders</h4>
          {ordersLoading ? (
            <Card className="p-5 text-center">
              <Spinner animation="border" size="sm" className="me-2" />
              Loading orders...
            </Card>
          ) : orders.length === 0 ? (
            <Card className="p-4 mb-4 text-center">
              <p className="text-muted mb-3">No orders yet. Start shopping!</p>
              <Button variant="primary" onClick={() => navigate("/products")}>
                Shop Now
              </Button>
            </Card>
          ) : (
            <Table striped bordered hover responsive className="mb-4">
              <thead className="table-dark">
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id || order._id}>
                    <td>
                      <Badge bg="secondary">ORD-{order.id || order._id?.toString().substring(0, 8)}</Badge>
                    </td>
                    <td>
                      {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      {order.products ? order.products.length : 0} items
                    </td>
                    <td className="fw-bold">₹{order.totalAmount || 0}</td>
                    <td>
                      <Badge bg={
                        order.orderStatus === "delivered" ? "success" :
                        order.orderStatus === "pending" ? "warning" :
                        order.orderStatus === "cancelled" ? "danger" : 
                        order.orderStatus === "confirmed" ? "info" : "secondary"
                      }>
                        {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1) || 'Pending'}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => navigate(`/orders/${order.id || order._id}`)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          <h4>Featured Products</h4>
          <Row xs={1} sm={2} md={3} lg={4} className="g-3 mb-4">
            {filteredProducts.map(product => (
              <Col key={product.id}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="d-flex flex-column justify-content-between">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="img-fluid rounded mb-3"
                        style={{ height: "150px", width: "100%", objectFit: "contain" }}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/150x150?text=No+Image";
                        }}
                      />
                    ) : (
                      <div className="text-center mb-3" style={{ height: "150px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa" }}>
                        <span className="text-muted">No Image</span>
                      </div>
                    )}
                    <Card.Title className="h6 text-truncate">{product.name}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted text-capitalize">
                      {product.category}
                    </Card.Subtitle>
                    <Card.Text className="fw-bold fs-5">₹{product.price}</Card.Text>
                    <Card.Text>
                      <Badge bg={product.stock_quantity > 0 ? "success" : "danger"}>
                        {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity})` : "Out of Stock"}
                      </Badge>
                    </Card.Text>
                    {product.stock_quantity > 0 ? (
                      <div className="d-flex align-items-center gap-2">
                        <Form.Control
                          type="number"
                          min="1"
                          max={product.stock_quantity}
                          value={quantities[product.id] || 1}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          size="sm"
                          style={{ width: "70px" }}
                        />
                        <Button
                          variant="primary"
                          onClick={() => addToCart(product.id, quantities[product.id] || 1)}
                          size="sm"
                          className="flex-grow-1"
                          disabled={!product.stock_quantity}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    ) : (
                      <Button variant="secondary" disabled size="sm" className="w-100">
                        Out of Stock
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Card className="p-4 mb-4 border-0 shadow-sm">
            <Card.Title className="mb-3">Quick Actions</Card.Title>
            <div className="d-flex flex-wrap gap-2">
              <Button variant="outline-primary" onClick={() => navigate("/products")}>
                Browse All Products
              </Button>
              <Button variant="outline-success" onClick={() => navigate("/cart")}>
                View Cart ({getCartItemCount()})
              </Button>
              <Button variant="outline-info" onClick={() => navigate("/my-orders")}>
                My Orders ({orders.length})
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate("/profile")}>
                My Profile
              </Button>
              <Button variant="outline-dark" onClick={() => navigate("/checkout")}>
                Checkout
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;