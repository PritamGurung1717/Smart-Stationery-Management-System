import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col, Card, Button, Table, Badge, Form, Spinner, Alert } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Nepal"
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    setUser(storedUser);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    
    fetchCart();
    fetchUserAddress(storedUser);
  }, [navigate]);

  const fetchCart = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users/cart");
      setCart(response.data.cart || { items: [] });
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAddress = (user) => {
    if (user.address) {
      setShippingAddress(prev => ({
        ...prev,
        address: user.address
      }));
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      await removeFromCart(productId);
      return;
    }

    try {
      await axios.put("http://localhost:5000/api/users/cart/update", {
        productId,
        quantity
      });
      fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert("Failed to update quantity");
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/cart/remove/${productId}`);
      fetchCart();
    } catch (error) {
      console.error("Error removing from cart:", error);
      alert("Failed to remove item");
    }
  };

  const clearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your cart?")) return;
    
    try {
      await axios.delete("http://localhost:5000/api/users/cart/clear");
      setCart({ items: [] });
    } catch (error) {
      console.error("Error clearing cart:", error);
      alert("Failed to clear cart");
    }
  };

  const calculateSubtotal = () => {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    // Add shipping/discount logic here if needed
    return subtotal;
  };

  const proceedToCheckout = () => {
    if (cart.items.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode) {
      alert("Please fill in all shipping details");
      return;
    }

    // Save cart and shipping info to local storage for checkout
    localStorage.setItem("cart", JSON.stringify(cart.items));
    localStorage.setItem("shippingAddress", JSON.stringify(shippingAddress));
    
    navigate("/checkout");
  };

  const continueShopping = () => {
    navigate("/products");
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading your cart...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Back Button */}
      <div className="mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={handleGoBack}
          className="d-flex align-items-center gap-2"
        >
          <FaArrowLeft /> Back
        </Button>
      </div>
      
      <h1 className="mb-4">🛒 Your Shopping Cart</h1>
      
      {cart.items.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <div className="mb-4" style={{ fontSize: "4rem" }}>🛒</div>
            <h3>Your cart is empty</h3>
            <p className="text-muted mb-4">Looks like you haven't added any products to your cart yet.</p>
            <div className="d-flex justify-content-center gap-2">
              <Button variant="outline-secondary" onClick={handleGoBack}>
                Go Back
              </Button>
              <Button variant="primary" onClick={continueShopping}>
                Continue Shopping
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row>
            <Col lg={8}>
              <Card className="mb-4">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4>Cart Items ({cart.items.length})</h4>
                    <Button variant="outline-danger" size="sm" onClick={clearCart}>
                      Clear Cart
                    </Button>
                  </div>
                  
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.items.map((item) => (
                        <tr key={item.product?.id || item.product}>
                          <td>
                            <div className="d-flex align-items-center">
                              {item.product?.image && (
                                <img 
                                  src={item.product.image} 
                                  alt={item.product.name}
                                  style={{ width: "50px", height: "50px", objectFit: "cover", marginRight: "10px" }}
                                />
                              )}
                              <div>
                                <h6 className="mb-0">{item.product?.name || "Product"}</h6>
                                <small className="text-muted">{item.product?.category || ""}</small>
                              </div>
                            </div>
                          </td>
                          <td>₹{item.price}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                onClick={() => updateQuantity(item.product?.id || item.product, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <span className="mx-2">{item.quantity}</span>
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => updateQuantity(item.product?.id || item.product, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </td>
                          <td>₹{item.price * item.quantity}</td>
                          <td>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => removeFromCart(item.product?.id || item.product)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              {/* Shipping Address */}
              <Card className="mb-4">
                <Card.Body>
                  <h4 className="mb-3">Shipping Address</h4>
                  <Row>
                    <Col md={12} className="mb-3">
                      <Form.Label>Full Address *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Street address, apartment, suite, etc."
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                        required
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>City *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="City"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        required
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>State *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="State"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        required
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>ZIP Code *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="ZIP Code"
                        value={shippingAddress.zipCode}
                        onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                        required
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Country</Form.Label>
                      <Form.Control
                        type="text"
                        value={shippingAddress.country}
                        readOnly
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="sticky-top" style={{ top: "20px" }}>
                <Card.Body>
                  <h4 className="mb-3">Order Summary</h4>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal</span>
                    <span>₹{calculateSubtotal()}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  
                  {user?.role === "institute" && (
                    <div className="d-flex justify-content-between mb-2">
                      <span>Bulk Discount (10%)</span>
                      <span className="text-success">-₹{(calculateSubtotal() * 0.1).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <hr />
                  
                  <div className="d-flex justify-content-between mb-3">
                    <h5>Total</h5>
                    <h5>
                      ₹{user?.role === "institute" 
                        ? (calculateSubtotal() * 0.9).toFixed(2) 
                        : calculateSubtotal()}
                    </h5>
                  </div>
                  
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-100 mb-3"
                    onClick={proceedToCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <Button 
                    variant="outline-secondary" 
                    className="w-100"
                    onClick={continueShopping}
                  >
                    Continue Shopping
                  </Button>
                  
                  {user?.role === "institute" && (
                    <Alert variant="info" className="mt-3">
                      <strong>Institute Discount Applied!</strong> You get 10% off on all orders.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default CartPage;