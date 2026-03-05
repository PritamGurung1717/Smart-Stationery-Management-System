import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Button, Badge, Spinner, Alert, Table } from "react-bootstrap";
import { FaHandHoldingHeart, FaEye } from "react-icons/fa";
import axios from "axios";

const MyRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get("http://localhost:5000/api/donations/user/requests", { headers });
      
      if (response.data.success) {
        setRequests(response.data.requests || []);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load your requests");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", paddingBottom: "3rem" }}>
      <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", padding: "2rem 0", marginBottom: "2rem" }}>
        <Container>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <FaHandHoldingHeart /> My Requests
          </h1>
          <p style={{ fontSize: "1.1rem", opacity: 0.95, margin: 0 }}>Track your donation requests</p>
        </Container>
      </div>

      <Container>
        {error && <Alert variant="danger">{error}</Alert>}

        <div style={{ marginBottom: "2rem" }}>
          <h4>Total Requests: {requests.length}</h4>
        </div>

        {requests.length === 0 ? (
          <Card style={{ border: "none", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <Card.Body className="text-center py-5">
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🤝</div>
              <h4>No Requests Yet</h4>
              <p className="text-muted">Browse donations and request items you need</p>
              <Button variant="primary" onClick={() => navigate("/donations")}>
                Browse Donations
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Card style={{ border: "none", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <Table responsive hover>
              <thead style={{ background: "#f9fafb" }}>
                <tr>
                  <th>Donation</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td style={{ fontWeight: 600 }}>
                      {request.donation ? request.donation.title : "N/A"}
                    </td>
                    <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {request.message}
                    </td>
                    <td>
                      <Badge bg={request.status === "accepted" ? "success" : request.status === "rejected" ? "danger" : "warning"}>
                        {request.status}
                      </Badge>
                    </td>
                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button 
                        size="sm" 
                        variant="outline-primary" 
                        onClick={() => navigate(`/donations/${request.donation_id}`)}
                      >
                        <FaEye /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </Container>
    </div>
  );
};

export default MyRequests;
