import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Card, Table, Badge, Button, Row, Col, Spinner, Alert } from "react-bootstrap";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      console.log("Fetching order with integer ID:", id);
      
      // ALWAYS use integer ID - convert to number
      const orderId = parseInt(id);
      if (isNaN(orderId) || orderId <= 0) {
        setError("Invalid order ID");
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`http://localhost:5000/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        setError(response.data.message || "Order not found");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      
      if (error.response?.status === 404) {
        setError("Order not found");
      } else if (error.response?.status === 403) {
        setError("You don't have permission to view this order");
      } else if (error.response?.status === 500 && error.response?.data?.error?.includes("Cast to Number")) {
        setError("Invalid order ID format. Please use the correct order number.");
      } else {
        setError("Failed to load order details. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const orderId = parseInt(id);
      
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Order cancelled successfully!");
      fetchOrderDetails();
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(error.response?.data?.message || "Failed to cancel order");
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading order details...</p>
        </div>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Error</h4>
          <p>{error || "Order not found"}</p>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => navigate("/my-orders")}>
              Back to Orders
            </Button>
            <Button variant="secondary" onClick={fetchOrderDetails}>
              Try Again
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Button variant="outline-secondary" className="mb-4" onClick={() => navigate("/my-orders")}>
        ← Back to Orders
      </Button>
      
      <h1 className="mb-4">Order #{order.id}</h1>
      
      <Row className="g-4">
        <Col lg={8}>
          {/* Order Items */}
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Order Items</Card.Title>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.products && order.products.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div>
                            <h6 className="mb-0">{item.productName || `Product ${item.product}`}</h6>
                            <small className="text-muted">Product ID: {item.product}</small>
                          </div>
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>₹{item.unitPrice || 0}</td>
                      <td>₹{item.subtotal || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Order Status */}
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Order Status</Card.Title>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Badge 
                  bg={
                    order.orderStatus === "delivered" ? "success" :
                    order.orderStatus === "cancelled" ? "danger" :
                    order.orderStatus === "shipped" ? "info" :
                    order.orderStatus === "processing" ? "primary" : "warning"
                  }
                  className="fs-6"
                >
                  {order.orderStatus?.toUpperCase()}
                </Badge>
                
                {order.orderStatus === "pending" && (
                  <Button variant="danger" size="sm" onClick={cancelOrder}>
                    Cancel Order
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Order Summary */}
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Order Summary</Card.Title>
              <div className="mb-3">
                <p><strong>Order ID:</strong> #{order.id}</p>
                <p><strong>Order Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
                <p><strong>Order Type:</strong> 
                  <Badge bg={order.orderType === "bulk" ? "primary" : "secondary"} className="ms-2">
                    {order.orderType}
                  </Badge>
                </p>
              </div>
              
              <div className="mb-3">
                <h5>Payment Details</h5>
                <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                <p><strong>Payment Status:</strong> 
                  <Badge bg={order.paymentStatus === "completed" ? "success" : "warning"} className="ms-2">
                    {order.paymentStatus}
                  </Badge>
                </p>
              </div>

              <div className="mb-3">
                <h5>Amount Details</h5>
                <div className="d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span>₹{order.subtotal || 0}</span>
                </div>
                {order.discount > 0 && (
                  <div className="d-flex justify-content-between text-success">
                    <span>Discount:</span>
                    <span>-₹{order.discount}</span>
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between">
                  <strong>Total:</strong>
                  <strong>₹{order.totalAmount || 0}</strong>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="mt-3">
                  <h6>Tracking Information</h6>
                  <p className="mb-0">Tracking #: {order.trackingNumber}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Shipping Address */}
          <Card>
            <Card.Body>
              <Card.Title>Shipping Address</Card.Title>
              {order.shippingAddress ? (
                <div>
                  <p className="mb-1">{order.shippingAddress.address}</p>
                  <p className="mb-1">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p className="mb-0">{order.shippingAddress.country}</p>
                </div>
              ) : (
                <p className="text-muted">No shipping address provided</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetails;