import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { FaGift, FaImage, FaTimes } from "react-icons/fa";
import axios from "axios";

const CreateDonation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    condition: "",
    pickup_location: "",
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const categories = [
    { value: "books", label: "Books" },
    { value: "stationery", label: "Stationery" },
    { value: "electronics", label: "Electronics" },
    { value: "furniture", label: "Furniture" },
    { value: "other", label: "Other" },
  ];

  const conditions = [
    { value: "new", label: "New" },
    { value: "like_new", label: "Like New" },
    { value: "good", label: "Good" },
    { value: "used", label: "Used" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + images.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }

    // Validate file types and sizes
    const validFiles = [];
    const validPreviews = [];

    for (const file of files) {
      // Check file type
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image file`);
        continue;
      }

      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is too large. Maximum size is 5MB`);
        continue;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        validPreviews.push(reader.result);
        if (validPreviews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...validPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    setImages((prev) => [...prev, ...validFiles]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.title || formData.title.trim().length < 5) {
      setError("Title must be at least 5 characters");
      return;
    }

    if (!formData.description || formData.description.trim().length < 10) {
      setError("Description must be at least 10 characters");
      return;
    }

    if (!formData.category) {
      setError("Please select a category");
      return;
    }

    if (!formData.condition) {
      setError("Please select a condition");
      return;
    }

    if (!formData.pickup_location || formData.pickup_location.trim().length === 0) {
      setError("Pickup location is required");
      return;
    }

    if (images.length === 0) {
      setError("At least 1 image is required");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to create a donation");
        setLoading(false);
        return;
      }

      // Create FormData
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("category", formData.category);
      formDataToSend.append("condition", formData.condition);
      formDataToSend.append("pickup_location", formData.pickup_location.trim());

      // Append images
      images.forEach((image) => {
        formDataToSend.append("images", image);
      });

      const response = await axios.post(
        "http://localhost:5000/api/donations",
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setSuccess("Donation created successfully!");
        setTimeout(() => {
          navigate("/donations");
        }, 1500);
      }
    } catch (err) {
      console.error("Error creating donation:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.join(", ") ||
          "Failed to create donation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "2rem 0",
          marginBottom: "2rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <Container>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <FaGift />
            Create Donation
          </h1>
          <p style={{ fontSize: "1.1rem", opacity: 0.95, margin: 0 }}>
            Share items you no longer need with others
          </p>
        </Container>
      </div>

      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card
              style={{
                border: "none",
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <Card.Body style={{ padding: "2rem" }}>
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError("")}>
                    {error}
                  </Alert>
                )}

                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  {/* Title */}
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 600 }}>
                      Title <span style={{ color: "red" }}>*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Mathematics Textbook Grade 10"
                      maxLength={100}
                      style={{
                        borderRadius: "8px",
                        padding: "0.75rem",
                      }}
                    />
                    <Form.Text className="text-muted">
                      Minimum 5 characters, maximum 100 characters
                    </Form.Text>
                  </Form.Group>

                  {/* Description */}
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 600 }}>
                      Description <span style={{ color: "red" }}>*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe the item, its condition, and any other relevant details..."
                      maxLength={1000}
                      style={{
                        borderRadius: "8px",
                        padding: "0.75rem",
                      }}
                    />
                    <Form.Text className="text-muted">
                      Minimum 10 characters, maximum 1000 characters
                    </Form.Text>
                  </Form.Group>

                  {/* Category and Condition */}
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: 600 }}>
                          Category <span style={{ color: "red" }}>*</span>
                        </Form.Label>
                        <Form.Select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          style={{
                            borderRadius: "8px",
                            padding: "0.75rem",
                          }}
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: 600 }}>
                          Condition <span style={{ color: "red" }}>*</span>
                        </Form.Label>
                        <Form.Select
                          name="condition"
                          value={formData.condition}
                          onChange={handleInputChange}
                          style={{
                            borderRadius: "8px",
                            padding: "0.75rem",
                          }}
                        >
                          <option value="">Select Condition</option>
                          {conditions.map((cond) => (
                            <option key={cond.value} value={cond.value}>
                              {cond.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Pickup Location */}
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 600 }}>
                      Pickup Location <span style={{ color: "red" }}>*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="pickup_location"
                      value={formData.pickup_location}
                      onChange={handleInputChange}
                      placeholder="e.g., Main Campus, Building A, Room 101"
                      maxLength={200}
                      style={{
                        borderRadius: "8px",
                        padding: "0.75rem",
                      }}
                    />
                    <Form.Text className="text-muted">
                      Where can the recipient pick up the item?
                    </Form.Text>
                  </Form.Group>

                  {/* Images */}
                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontWeight: 600 }}>
                      Images <span style={{ color: "red" }}>*</span>
                    </Form.Label>
                    <div
                      style={{
                        border: "2px dashed #dee2e6",
                        borderRadius: "8px",
                        padding: "2rem",
                        textAlign: "center",
                        cursor: "pointer",
                        background: "#f8f9fa",
                      }}
                      onClick={() => document.getElementById("imageInput").click()}
                    >
                      <FaImage style={{ fontSize: "3rem", color: "#6c757d", marginBottom: "1rem" }} />
                      <p style={{ margin: 0, color: "#6c757d" }}>
                        Click to upload images (Max 5 images, 5MB each)
                      </p>
                      <Form.Control
                        id="imageInput"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        style={{ display: "none" }}
                      />
                    </div>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <Row className="mt-3">
                        {imagePreviews.map((preview, index) => (
                          <Col key={index} xs={6} md={4} lg={3} className="mb-3">
                            <div style={{ position: "relative" }}>
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "150px",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                }}
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => removeImage(index)}
                                style={{
                                  position: "absolute",
                                  top: "5px",
                                  right: "5px",
                                  borderRadius: "50%",
                                  width: "30px",
                                  height: "30px",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <FaTimes />
                              </Button>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Form.Group>

                  {/* Submit Buttons */}
                  <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                    <Button
                      variant="outline-secondary"
                      onClick={() => navigate("/donations")}
                      disabled={loading}
                      style={{
                        borderRadius: "8px",
                        padding: "0.75rem 2rem",
                        fontWeight: 600,
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      style={{
                        borderRadius: "8px",
                        padding: "0.75rem 2rem",
                        fontWeight: 600,
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: "none",
                      }}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            style={{ marginRight: "0.5rem" }}
                          />
                          Creating...
                        </>
                      ) : (
                        "Create Donation"
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CreateDonation;
