import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Button, Badge, Spinner, Alert } from "react-bootstrap";
import { FaGift, FaHeart, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import axios from "axios";

const DonationSection = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to view donations");
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get("http://localhost:5000/api/donations?limit=4", {
        headers,
      });

      if (response.data.success) {
        setDonations(response.data.donations || []);
      }
    } catch (err) {
      console.error("Error fetching donations:", err);
      setError("Failed to load donations");
    } finally {
      setLoading(false);
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
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading donations...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #fef3e2 0%, #f5e6d3 100%)",
        padding: "3rem 2rem",
        borderRadius: "16px",
        marginTop: "2rem",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <Badge
          bg="warning"
          text="dark"
          style={{
            fontSize: "0.9rem",
            padding: "0.5rem 1.5rem",
            borderRadius: "50px",
            marginBottom: "1rem",
            fontWeight: 600,
          }}
        >
          Community Sharing
        </Badge>
        <h2
          style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            color: "#1a1a2e",
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
          }}
        >
          <FaGift style={{ color: "#f59e0b" }} />
          Donation Marketplace
        </h2>
        <p
          style={{
            fontSize: "1.1rem",
            color: "#6b7280",
            maxWidth: "700px",
            margin: "0 auto 1.5rem",
          }}
        >
          Share items you no longer need or find something useful from the community
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/donations/create")}
            style={{
              borderRadius: "50px",
              padding: "0.75rem 2rem",
              fontWeight: 600,
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              border: "none",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
            }}
          >
            <FaGift style={{ marginRight: "0.5rem" }} />
            Donate Item
          </Button>
          <Button
            variant="outline-dark"
            size="lg"
            onClick={() => navigate("/donations")}
            style={{
              borderRadius: "50px",
              padding: "0.75rem 2rem",
              fontWeight: 600,
              border: "2px solid #1a1a2e",
            }}
          >
            Browse All Donations
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Donations Grid */}
      {donations.length === 0 ? (
        <Card
          style={{
            border: "none",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            borderRadius: "12px",
            background: "white",
          }}
        >
          <Card.Body className="text-center py-5">
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎁</div>
            <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No Donations Available</h4>
            <p className="text-muted">Be the first to donate an item to the community!</p>
            <Button
              variant="primary"
              onClick={() => navigate("/donations/create")}
              style={{ marginTop: "1rem" }}
            >
              Donate Your First Item
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row className="g-4">
            {donations.map((donation) => {
              const conditionBadge = getConditionBadge(donation.condition);
              const categoryIcon = getCategoryIcon(donation.category);

              return (
                <Col key={donation.id} md={6} lg={3}>
                  <Card
                    onClick={() => navigate(`/donations/${donation.id}`)}
                    style={{
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      borderRadius: "12px",
                      height: "100%",
                      background: "white",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-8px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    }}
                  >
                    {/* Status Badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        zIndex: 1,
                      }}
                    >
                      <Badge
                        bg={donation.status === "available" ? "success" : "warning"}
                        style={{
                          padding: "0.4rem 0.8rem",
                          borderRadius: "8px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "capitalize",
                        }}
                      >
                        {donation.status}
                      </Badge>
                    </div>

                    {/* Condition Badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        zIndex: 1,
                      }}
                    >
                      <Badge
                        bg={conditionBadge.bg}
                        style={{
                          padding: "0.4rem 0.8rem",
                          borderRadius: "8px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        {conditionBadge.text}
                      </Badge>
                    </div>

                    {/* Image */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "200px",
                        overflow: "hidden",
                        background: "#f9fafb",
                      }}
                    >
                      {donation.images && donation.images.length > 0 ? (
                        <img
                          src={donation.images[0].startsWith("http") ? donation.images[0] : `http://localhost:5000${donation.images[0]}`}
                          alt={donation.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                            color: "#6b7280",
                            fontWeight: 600,
                            fontSize: "3rem",
                          }}
                        >
                          {categoryIcon}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <Card.Body style={{ padding: "1.25rem" }}>
                      {/* Category */}
                      <div style={{ marginBottom: "0.75rem" }}>
                        <Badge
                          bg="light"
                          text="dark"
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            padding: "0.25rem 0.75rem",
                            textTransform: "capitalize",
                            borderRadius: "50px",
                          }}
                        >
                          {categoryIcon} {donation.category}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h5
                        style={{
                          fontWeight: 700,
                          marginBottom: "0.5rem",
                          fontSize: "1rem",
                          color: "#1a1a2e",
                          minHeight: "2.5rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {donation.title}
                      </h5>

                      {/* Description */}
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#6b7280",
                          marginBottom: "0.75rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {donation.description}
                      </p>

                      {/* Location */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.5rem",
                          fontSize: "0.85rem",
                          color: "#6b7280",
                        }}
                      >
                        <FaMapMarkerAlt style={{ color: "#ef4444" }} />
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {donation.pickup_location}
                        </span>
                      </div>

                      {/* Time */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.8rem",
                          color: "#9ca3af",
                        }}
                      >
                        <FaClock />
                        <span>{getTimeAgo(donation.created_at)}</span>
                      </div>

                      {/* Donor Info */}
                      {donation.donor && (
                        <div
                          style={{
                            marginTop: "0.75rem",
                            paddingTop: "0.75rem",
                            borderTop: "1px solid #e5e7eb",
                            fontSize: "0.8rem",
                            color: "#6b7280",
                          }}
                        >
                          Donated by: <strong>{donation.donor.name}</strong>
                        </div>
                      )}

                      {/* View Button */}
                      <Button
                        variant="outline-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/donations/${donation.id}`);
                        }}
                        style={{
                          width: "100%",
                          marginTop: "0.75rem",
                          borderRadius: "8px",
                          fontWeight: 600,
                          border: "2px solid #f59e0b",
                          color: "#f59e0b",
                        }}
                      >
                        View Details
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* View All Button */}
          {donations.length >= 4 && (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Button
                variant="outline-dark"
                size="lg"
                onClick={() => navigate("/donations")}
                style={{
                  borderRadius: "50px",
                  padding: "0.875rem 2.5rem",
                  fontWeight: 600,
                  border: "2px solid #1a1a2e",
                }}
              >
                View All Donations
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DonationSection;
