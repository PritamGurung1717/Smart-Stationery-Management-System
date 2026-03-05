import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Modal,
  Form,
  Carousel,
} from "react-bootstrap";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaClock,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaEdit,
  FaTrash,
  FaComments,
} from "react-icons/fa";
import axios from "axios";

const DonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
    fetchDonationDetails();
  }, [id]);

  const fetchDonationDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to view donation details");
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`http://localhost:5000/api/donations/${id}`, {
        headers,
      });

      if (response.data.success) {
        setDonation(response.data.donation);
      }
    } catch (err) {
      console.error("Error fetching donation details:", err);
      setError(err.response?.data?.message || "Failed to load donation details");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDonation = async () => {
    if (!requestMessage || requestMessage.trim().length < 10) {
      alert("Please write a message (at least 10 characters)");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
        `http://localhost:5000/api/donations/${id}/request`,
        { message: requestMessage },
        { headers }
      );

      alert("Request sent successfully! The donor will review your request.");
      setShowRequestModal(false);
      setRequestMessage("");
      fetchDonationDetails();
    } catch (err) {
      console.error("Error requesting donation:", err);
      alert(err.response?.data?.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this donation?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      await axios.delete(`http://localhost:5000/api/donations/${id}`, { headers });

      alert("Donation deleted successfully");
      navigate("/donations");
    } catch (err) {
      console.error("Error deleting donation:", err);
      alert(err.response?.data?.message || "Failed to delete donation");
    }
  };

  const getConditionBadge = (condition) => {
    const badges = {
      new: { bg: "success", text: "New" },
      like_new: { bg: "info", text: "Like New" },
      good: { bg: "primary", text: "Good" },
      used: { bg: "secondary", text: "Used" },
    };
    return badges[condition] || badges.used;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      books: "📚",
      stationery: "✏️",
      electronics: "💻",
      furniture: "🪑",
      other: "📦",
    };
    return icons[category] || "📦";
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
          <p style={{ marginTop: "1rem", fontSize: "1.1rem", fontWeight: 600 }}>
            Loading donation details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          padding: "2rem",
        }}
      >
        <Container>
          <Alert variant="danger">{error || "Donation not found"}</Alert>
          <Button variant="primary" onClick={() => navigate("/donations")}>
            <FaArrowLeft style={{ marginRight: "0.5rem" }} />
            Back to Donations
          </Button>
        </Container>
      </div>
    );
  }

  const conditionBadge = getConditionBadge(donation.condition);
  const categoryIcon = getCategoryIcon(donation.category);
  const isOwner = currentUser && donation.donor_id === currentUser.id;
  const canRequest = donation.status === "available" && !isOwner;
  const canChat = donation.status === "reserved" && (isOwner || donation.accepted_requester_id === currentUser?.id);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        paddingBottom: "3rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          color: "white",
          padding: "2rem 0",
          marginBottom: "2rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <Container>
          <Button
            variant="link"
            onClick={() => navigate("/donations")}
            style={{
              color: "white",
              textDecoration: "none",
              fontSize: "1rem",
              fontWeight: 600,
              padding: "0.5rem 1rem",
              marginBottom: "1rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FaArrowLeft />
            Back to Donations
          </Button>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              marginBottom: "0.5rem",
            }}
          >
            {donation.title}
          </h1>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Badge
              bg={donation.status === "available" ? "success" : "warning"}
              style={{ fontSize: "1rem", padding: "0.5rem 1rem", textTransform: "capitalize" }}
            >
              {donation.status}
            </Badge>
            <Badge
              bg={conditionBadge.bg}
              style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
            >
              {conditionBadge.text}
            </Badge>
            <Badge
              bg="light"
              text="dark"
              style={{ fontSize: "1rem", padding: "0.5rem 1rem", textTransform: "capitalize" }}
            >
              {categoryIcon} {donation.category}
            </Badge>
          </div>
        </Container>
      </div>

      <Container>
        <Row>
          {/* Images */}
          <Col lg={6}>
            <Card
              style={{
                border: "none",
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                marginBottom: "2rem",
                overflow: "hidden",
              }}
            >
              {donation.images && donation.images.length > 0 ? (
                <Carousel>
                  {donation.images.map((image, index) => (
                    <Carousel.Item key={index}>
                      <img
                        src={`http://localhost:5000${image}`}
                        alt={`${donation.title} - ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "400px",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/400x400?text=No+Image";
                        }}
                      />
                    </Carousel.Item>
                  ))}
                </Carousel>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "400px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                    fontSize: "5rem",
                  }}
                >
                  {categoryIcon}
                </div>
              )}
            </Card>
          </Col>

          {/* Details */}
          <Col lg={6}>
            {/* Description */}
            <Card
              style={{
                border: "none",
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                marginBottom: "2rem",
              }}
            >
              <Card.Body style={{ padding: "2rem" }}>
                <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>Description</h3>
                <p style={{ fontSize: "1rem", color: "#4b5563", lineHeight: 1.7 }}>
                  {donation.description}
                </p>

                <hr style={{ margin: "1.5rem 0" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <FaMapMarkerAlt style={{ fontSize: "1.5rem", color: "#ef4444" }} />
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Pickup Location</div>
                      <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                        {donation.pickup_location}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <FaClock style={{ fontSize: "1.5rem", color: "#3b82f6" }} />
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Posted</div>
                      <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                        {getTimeAgo(donation.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Donor Info */}
            {donation.donor && (
              <Card
                style={{
                  border: "none",
                  borderRadius: "16px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  marginBottom: "2rem",
                }}
              >
                <Card.Body style={{ padding: "2rem" }}>
                  <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>Donor Information</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <FaUser style={{ fontSize: "1.5rem", color: "#8b5cf6" }} />
                      <div>
                        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Name</div>
                        <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                          {donation.donor.name}
                        </div>
                      </div>
                    </div>

                    {donation.donor.email && (
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <FaEnvelope style={{ fontSize: "1.5rem", color: "#10b981" }} />
                        <div>
                          <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Email</div>
                          <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                            {donation.donor.email}
                          </div>
                        </div>
                      </div>
                    )}

                    {donation.donor.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <FaPhone style={{ fontSize: "1.5rem", color: "#f59e0b" }} />
                        <div>
                          <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Phone</div>
                          <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                            {donation.donor.phone}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Actions */}
            <Card
              style={{
                border: "none",
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <Card.Body style={{ padding: "2rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {canRequest && (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setShowRequestModal(true)}
                      style={{
                        borderRadius: "12px",
                        fontWeight: 600,
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        border: "none",
                      }}
                    >
                      Request This Item
                    </Button>
                  )}

                  {canChat && (
                    <Button
                      variant="info"
                      size="lg"
                      onClick={() => navigate(`/donations/${id}/chat`)}
                      style={{
                        borderRadius: "12px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <FaComments />
                      Open Chat
                    </Button>
                  )}

                  {isOwner && (
                    <>
                      <Button
                        variant="outline-primary"
                        size="lg"
                        onClick={() => navigate(`/my-donations`)}
                        style={{
                          borderRadius: "12px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <FaEdit />
                        Manage Donation
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="lg"
                        onClick={handleDelete}
                        style={{
                          borderRadius: "12px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <FaTrash />
                        Delete Donation
                      </Button>
                    </>
                  )}

                  {donation.status === "reserved" && !isOwner && !canChat && (
                    <Alert variant="warning" style={{ marginBottom: 0 }}>
                      This item is reserved by another user.
                    </Alert>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Request Modal */}
      <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Request Donation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Tell the donor why you need this item and how you'll use it.
          </p>
          <Form.Group>
            <Form.Label>Your Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="I would like to request this item because..."
              maxLength={500}
            />
            <Form.Text className="text-muted">
              Minimum 10 characters, maximum 500 characters
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRequestModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRequestDonation}
            disabled={submitting || requestMessage.trim().length < 10}
          >
            {submitting ? "Sending..." : "Send Request"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DonationDetails;
