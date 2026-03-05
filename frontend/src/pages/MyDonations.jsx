import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Table, Modal, ListGroup } from "react-bootstrap";
import { FaGift, FaEye, FaTrash, FaCheck, FaUsers, FaEdit, FaComments, FaBell, FaUser, FaClock } from "react-icons/fa";
import axios from "axios";

const MyDonations = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    fetchMyDonations();
  }, []);

  const fetchMyDonations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to view your donations");
        navigate("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get("http://localhost:5000/api/donations/user/donations", { headers });
      
      if (response.data.success) {
        // Fetch request counts for each donation
        const donationsWithCounts = await Promise.all(
          (response.data.donations || []).map(async (donation) => {
            try {
              const reqResponse = await axios.get(
                `http://localhost:5000/api/donations/${donation.id}/requests`,
                { headers }
              );
              const pendingCount = reqResponse.data.requests?.filter(r => r.status === 'pending').length || 0;
              return { ...donation, pendingRequestCount: pendingCount };
            } catch (err) {
              return { ...donation, pendingRequestCount: 0 };
            }
          })
        );
        setDonations(donationsWithCounts);
      }
    } catch (err) {
      console.error("Error fetching donations:", err);
      setError(err.response?.data?.message || "Failed to load your donations");
    } finally {
      setLoading(false);
    }
  };

  const fetchDonationRequests = async (donationId) => {
    try {
      setLoadingRequests(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `http://localhost:5000/api/donations/${donationId}/requests`,
        { headers }
      );
      
      if (response.data.success) {
        setRequests(response.data.requests || []);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      alert(err.response?.data?.message || "Failed to load requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleViewRequests = async (donation) => {
    setSelectedDonation(donation);
    setShowRequestsModal(true);
    await fetchDonationRequests(donation.id);
  };

  const handleAcceptRequest = async (requestId) => {
    if (!window.confirm("Accept this request? This will mark the donation as reserved.")) return;

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `http://localhost:5000/api/donations/requests/${requestId}/accept`,
        {},
        { headers }
      );
      alert("Request accepted! You can now chat with the requester.");
      setShowRequestsModal(false);
      fetchMyDonations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm("Reject this request?")) return;

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `http://localhost:5000/api/donations/requests/${requestId}/reject`,
        {},
        { headers }
      );
      alert("Request rejected");
      await fetchDonationRequests(selectedDonation.id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject request");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this donation?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/donations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Donation deleted successfully");
      fetchMyDonations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete donation");
    }
  };

  const handleMarkCompleted = async (id) => {
    if (!window.confirm("Mark this donation as completed?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/donations/${id}/mark-completed`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Donation marked as completed");
      fetchMyDonations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update donation");
    }
  };

  const handleEdit = (donation) => {
    // Navigate to edit page or show edit modal
    navigate(`/donations/${donation.id}`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", paddingBottom: "3rem" }}>
      <div style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white", padding: "2rem 0", marginBottom: "2rem", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <Container>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <FaGift /> My Donations
          </h1>
          <p style={{ fontSize: "1.1rem", opacity: 0.95, margin: 0 }}>Manage your donated items and requests</p>
        </Container>
      </div>

      <Container>
        {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h4 style={{ marginBottom: "0.5rem" }}>Total Donations: {donations.length}</h4>
            <p style={{ color: "#6b7280", margin: 0 }}>
              {donations.filter(d => d.pendingRequestCount > 0).length} with pending requests
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={() => navigate("/donations/create")}>
            <FaGift style={{ marginRight: "0.5rem" }} />
            Create New Donation
          </Button>
        </div>

        {donations.length === 0 ? (
          <Card style={{ border: "none", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <Card.Body className="text-center py-5">
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📦</div>
              <h4 style={{ fontWeight: 700, marginBottom: "1rem" }}>No Donations Yet</h4>
              <p style={{ color: "#6b7280", marginBottom: "2rem" }}>Start sharing items you no longer need</p>
              <Button variant="primary" size="lg" onClick={() => navigate("/donations/create")}>
                Create Your First Donation
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Card style={{ border: "none", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", overflow: "hidden" }}>
            <Table responsive hover style={{ marginBottom: 0 }}>
              <thead style={{ background: "linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)" }}>
                <tr>
                  <th style={{ fontWeight: 700, padding: "1rem" }}>Title</th>
                  <th style={{ fontWeight: 700 }}>Category</th>
                  <th style={{ fontWeight: 700 }}>Condition</th>
                  <th style={{ fontWeight: 700 }}>Status</th>
                  <th style={{ fontWeight: 700 }}>Requests</th>
                  <th style={{ fontWeight: 700 }}>Created</th>
                  <th style={{ fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => (
                  <tr key={donation.id} style={{ verticalAlign: "middle" }}>
                    <td style={{ fontWeight: 600, padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {donation.images && donation.images[0] ? (
                          <img 
                            src={`http://localhost:5000${donation.images[0]}`} 
                            alt={donation.title}
                            style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px" }}
                          />
                        ) : (
                          <div style={{ width: "50px", height: "50px", background: "#f3f4f6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            📦
                          </div>
                        )}
                        <span>{donation.title}</span>
                      </div>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" style={{ textTransform: "capitalize" }}>
                        {donation.category}
                      </Badge>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>
                      <Badge bg={
                        donation.condition === 'new' ? 'success' :
                        donation.condition === 'like_new' ? 'info' :
                        donation.condition === 'good' ? 'primary' : 'secondary'
                      }>
                        {donation.condition.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={
                        donation.status === "available" ? "success" : 
                        donation.status === "reserved" ? "warning" : 
                        "secondary"
                      }>
                        {donation.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant={donation.pendingRequestCount > 0 ? "danger" : "outline-secondary"}
                        onClick={() => handleViewRequests(donation)}
                        style={{ position: "relative" }}
                      >
                        <FaBell />
                        {donation.pendingRequestCount > 0 && (
                          <Badge 
                            bg="danger" 
                            pill
                            style={{ 
                              position: "absolute", 
                              top: "-8px", 
                              right: "-8px",
                              fontSize: "0.7rem"
                            }}
                          >
                            {donation.pendingRequestCount}
                          </Badge>
                        )}
                      </Button>
                    </td>
                    <td style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                      {new Date(donation.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <Button 
                          size="sm" 
                          variant="outline-primary" 
                          onClick={() => navigate(`/donations/${donation.id}`)}
                          title="View Details"
                        >
                          <FaEye />
                        </Button>
                        {donation.status === "available" && (
                          <Button 
                            size="sm" 
                            variant="outline-info" 
                            onClick={() => handleEdit(donation)}
                            title="Edit"
                          >
                            <FaEdit />
                          </Button>
                        )}
                        {donation.status === "reserved" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline-success" 
                              onClick={() => handleMarkCompleted(donation.id)}
                              title="Mark as Completed"
                            >
                              <FaCheck />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline-primary" 
                              onClick={() => navigate(`/donations/${donation.id}/chat`)}
                              title="Open Chat"
                            >
                              <FaComments />
                            </Button>
                          </>
                        )}
                        {donation.status === "available" && (
                          <Button 
                            size="sm" 
                            variant="outline-danger" 
                            onClick={() => handleDelete(donation.id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </Container>

      {/* Requests Modal */}
      <Modal show={showRequestsModal} onHide={() => setShowRequestsModal(false)} size="lg">
        <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white" }}>
          <Modal.Title>
            <FaUsers style={{ marginRight: "0.5rem" }} />
            Donation Requests
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDonation && (
            <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f9fafb", borderRadius: "8px" }}>
              <h5 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{selectedDonation.title}</h5>
              <p style={{ color: "#6b7280", margin: 0 }}>
                Status: <Badge bg={selectedDonation.status === "available" ? "success" : "warning"}>
                  {selectedDonation.status}
                </Badge>
              </p>
            </div>
          )}

          {loadingRequests ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-4">
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
              <h5>No Requests Yet</h5>
              <p style={{ color: "#6b7280" }}>When someone requests this item, you'll see it here</p>
            </div>
          ) : (
            <ListGroup>
              {requests.map((request) => (
                <ListGroup.Item key={request.id} style={{ border: "1px solid #e5e7eb", marginBottom: "0.75rem", borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <FaUser style={{ color: "#6b7280" }} />
                        <strong>{request.requester_name || `User #${request.requester_id}`}</strong>
                        <Badge bg={
                          request.status === 'pending' ? 'warning' :
                          request.status === 'accepted' ? 'success' : 'danger'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                      <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: 0 }}>
                        <FaClock style={{ marginRight: "0.25rem" }} />
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ padding: "0.75rem", background: "#f9fafb", borderRadius: "6px", marginBottom: "0.75rem" }}>
                    <p style={{ margin: 0, fontStyle: "italic" }}>"{request.message}"</p>
                  </div>

                  {request.status === 'pending' && selectedDonation?.status === 'available' && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Button 
                        size="sm" 
                        variant="success" 
                        onClick={() => handleAcceptRequest(request.id)}
                      >
                        <FaCheck style={{ marginRight: "0.25rem" }} />
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline-danger" 
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {request.status === 'accepted' && (
                    <Button 
                      size="sm" 
                      variant="primary" 
                      onClick={() => {
                        setShowRequestsModal(false);
                        navigate(`/donations/${selectedDonation.id}/chat`);
                      }}
                    >
                      <FaComments style={{ marginRight: "0.25rem" }} />
                      Open Chat
                    </Button>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRequestsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyDonations;
