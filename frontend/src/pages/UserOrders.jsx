import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Table, Badge, Button, Spinner, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "delivered": return "success";
      case "pending": return "warning";
      case "cancelled": return "danger";
      case "processing": return "primary";
      default: return "info";
    }
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">My Orders</h1>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <div className="mb-4" style={{ fontSize: "4rem" }}>📦</div>
            <h3>No orders yet</h3>
            <p className="text-muted mb-4">You haven't placed any orders yet.</p>
            <Button variant="primary" onClick={() => navigate("/products")}>
              Browse Products
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>ORD-{order.id}</td>
                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                <td>₹{order.totalAmount}</td>
                <td>
                  <Badge bg={getStatusColor(order.orderStatus)}>
                    {order.orderStatus}
                  </Badge>
                </td>
                <td>
                  <Badge bg={order.paymentStatus === "completed" ? "success" : "warning"}>
                    {order.paymentStatus}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default UserOrders;