import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from "react-bootstrap";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [] });
  const [shippingAddress, setShippingAddress] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India"
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [orderType, setOrderType] = useState("regular");
  const [loading, setLoading] = useState(false);
  const [loadingCart, setLoadingCart] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    setUser(storedUser);
    
    if (storedUser.role === "institute") {
      setOrderType("bulk");
    }

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    
    fetchCart();
    
    const savedAddress = JSON.parse(localStorage.getItem("shippingAddress")) || {};
    if (savedAddress) {
      setShippingAddress(prev => ({ ...prev, ...savedAddress }));
    }
  }, [navigate]);

  const fetchCart = async () => {
    try {
      setLoadingCart(true);
      const response = await axios.get("http://localhost:5000/api/users/cart");
      if (response.data.cart && response.data.cart.items) {
        setCart(response.data.cart);
      } else {
        setCart({ items: [] });
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart({ items: [] });
    } finally {
      setLoadingCart(false);
    }
  };

  const calculateSubtotal = () => {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    if (user?.role === "institute") {
      return calculateSubtotal() * 0.1;
    }
    return 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const validateStockBeforeOrder = async () => {
    try {
      for (const item of cart.items) {
        const productId = item.product;
        const response = await axios.get(`http://localhost:5000/api/products/${productId}`);
        const product = response.data.product;
        
        if (product.stock < item.quantity) {
          return {
            valid: false,
            message: `"${product.name}" has only ${product.stock} item(s) in stock, but you have ${item.quantity} in cart. Please update your cart.`
          };
        }
      }
      return { valid: true };
    } catch (error) {
      console.error("Error validating stock:", error);
      return {
        valid: false,
        message: "Failed to check stock availability. Please try again."
      };
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    
    if (!shippingAddress.address.trim() || !shippingAddress.city.trim() || 
        !shippingAddress.state.trim() || !shippingAddress.zipCode.trim()) {
      alert("Please fill in all required shipping address fields!");
      return;
    }

    setLoading(true);
    try {
      const stockValidation = await validateStockBeforeOrder();
      if (!stockValidation.valid) {
        alert(stockValidation.message);
        setLoading(false);
        return;
      }

      const products = cart.items.map(item => ({
        productId: item.product,
        quantity: item.quantity
      }));

      const orderData = {
        products,
        shippingAddress,
        paymentMethod,
        orderType,
        notes: ""
      };

      const response = await axios.post("http://localhost:5000/api/orders", orderData);
      
      localStorage.setItem("shippingAddress", JSON.stringify(shippingAddress));
      
      try {
        await axios.delete("http://localhost:5000/api/users/cart/clear");
      } catch (clearError) {
        console.error("Error clearing cart:", clearError);
      }
      
      alert("Order placed successfully!");
      navigate(`/orders/${response.data.order.id || response.data.order._id}`);
    } catch (error) {
      console.error("Error placing order:", error);
      
      let errorMessage = "Failed to place order";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingCart) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading checkout...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Checkout</h1>
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Body>
              <h4 className="mb-3">Order Summary</h4>
              {cart.items.length === 0 ? (
                <Alert variant="warning">
                  Your cart is empty. <a href="/products">Shop now</a>
                </Alert>
              ) : (
                <>
                  {cart.items.map((item, index) => (
                    <div key={item._id || `item-${index}`} className="d-flex justify-content-between align-items-center border-bottom py-2">
                      <div>
                        <h6 className="mb-1">Product ID: {item.product}</h6>
                        <small className="text-muted">Quantity: {item.quantity} × ₹{item.price}</small>
                      </div>
                      <div>₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                  <div className="mt-3">
                    <div className="d-flex justify-content-between">
                      <span>Subtotal</span>
                      <span>₹{calculateSubtotal()}</span>
                    </div>
                    {calculateDiscount() > 0 && (
                      <div className="d-flex justify-content-between text-success">
                        <span>Institute Discount (10%)</span>
                        <span>-₹{calculateDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    <hr />
                    <div className="d-flex justify-content-between">
                      <h5>Total</h5>
                      <h5>₹{calculateTotal().toFixed(2)}</h5>
                    </div>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Body>
              <h4 className="mb-3">Shipping Address</h4>
              <Row>
                <Col md={12} className="mb-3">
                  <Form.Label>Full Address *</Form.Label>
                  <Form.Control
                    type="text"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                    placeholder="Enter your full address"
                    required
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>City *</Form.Label>
                  <Form.Control
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                    placeholder="Enter city"
                    required
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>State *</Form.Label>
                  <Form.Control
                    type="text"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                    placeholder="Enter state"
                    required
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>ZIP Code *</Form.Label>
                  <Form.Control
                    type="text"
                    value={shippingAddress.zipCode}
                    onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                    placeholder="Enter ZIP code"
                    required
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                    placeholder="Enter country"
                  />
                  <Form.Text className="text-muted">
                    You can change to any country
                  </Form.Text>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Body>
              <h4 className="mb-3">Payment Method</h4>
              <Form>
                <Form.Check
                  type="radio"
                  id="cod"
                  label="Cash on Delivery (COD)"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  id="esewa"
                  label="eSewa"
                  name="paymentMethod"
                  value="esewa"
                  checked={paymentMethod === "esewa"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  id="khalti"
                  label="Khalti"
                  name="paymentMethod"
                  value="khalti"
                  checked={paymentMethod === "khalti"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="sticky-top" style={{ top: "20px" }}>
            <Card.Body>
              <h4 className="mb-3">Complete Order</h4>
              
              {user?.role === "institute" && (
                <Alert variant="info" className="mb-3">
                  <strong>Institute Order:</strong> You're placing a bulk order with 10% discount.
                </Alert>
              )}

              <div className="mb-3">
                <h5>Order Details</h5>
                <div className="d-flex justify-content-between">
                  <span>Items:</span>
                  <span>{cart.items.length}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span>₹{calculateSubtotal()}</span>
                </div>
                {calculateDiscount() > 0 && (
                  <div className="d-flex justify-content-between text-success">
                    <span>Discount:</span>
                    <span>-₹{calculateDiscount().toFixed(2)}</span>
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between">
                  <strong>Total:</strong>
                  <strong>₹{calculateTotal().toFixed(2)}</strong>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-100 mb-3"
                onClick={handlePlaceOrder}
                disabled={loading || cart.items.length === 0 || !shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>

              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() => navigate("/cart")}
              >
                Back to Cart
              </Button>

              <p className="text-muted small mt-3">
                By placing your order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;