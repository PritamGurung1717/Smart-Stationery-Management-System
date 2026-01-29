import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Card, Form, Button, Row, Col, Spinner, Alert } from "react-bootstrap";

const InstituteVerification = ({ setUser }) => {
  const navigate = useNavigate();
  const [user, setLocalUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    instituteName: "",
    invoiceNumber: "",
    panNumber: "",
    gstNumber: "",
    contactNumber: "",
    schoolName: "",
    type: "school",
    address: "",
    contactPerson: "",
    phone: "",
    email: "",
    grades: "",
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role !== "institute") {
      navigate("/login");
      return;
    }
    setLocalUser(storedUser);
    
    // Pre-fill form with existing data
    if (storedUser.instituteVerification) {
      setFormData(prev => ({
        ...prev,
        instituteName: storedUser.instituteVerification.instituteName || "",
        invoiceNumber: storedUser.instituteVerification.invoiceNumber || "",
        panNumber: storedUser.instituteVerification.panNumber || "",
        gstNumber: storedUser.instituteVerification.gstNumber || "",
        contactNumber: storedUser.instituteVerification.contactNumber || "",
      }));
    }
    
    if (storedUser.instituteInfo) {
      setFormData(prev => ({
        ...prev,
        schoolName: storedUser.instituteInfo.schoolName || "",
        type: storedUser.instituteInfo.type || "school",
        address: storedUser.instituteInfo.address || "",
        contactPerson: storedUser.instituteInfo.contactPerson || "",
        phone: storedUser.instituteInfo.phone || "",
        email: storedUser.instituteInfo.email || "",
        grades: storedUser.instituteInfo.grades?.join(", ") || "",
      }));
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const gradesArray = formData.grades
        .split(",")
        .map(grade => grade.trim())
        .filter(grade => grade !== "");

      const response = await axios.post(
        "http://localhost:5000/api/users/institute/verification/submit",
        {
          ...formData,
          grades: gradesArray,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local user data
      const updatedUser = {
        ...user,
        instituteVerification: response.data.verification,
        instituteInfo: response.data.instituteInfo,
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setLocalUser(updatedUser);
      
      alert("Verification request submitted successfully! Please wait for admin approval.");
      navigate("/institute-dashboard");
    } catch (error) {
      console.error("Error submitting verification:", error);
      alert("Failed to submit verification: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container className="py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Institute Verification</h1>
      
      {user.instituteVerification?.status === "pending" && (
        <Alert variant="warning" className="mb-4">
          <h5>Verification Pending</h5>
          <p>Your verification request is under review. You will be notified once it's approved.</p>
          <p><strong>Status:</strong> {user.instituteVerification.status}</p>
          {user.instituteVerification.comments && (
            <p><strong>Comments:</strong> {user.instituteVerification.comments}</p>
          )}
        </Alert>
      )}
      
      {user.instituteVerification?.status === "rejected" && (
        <Alert variant="danger" className="mb-4">
          <h5>Verification Rejected</h5>
          <p>Your verification request was rejected. Please update the information and resubmit.</p>
          {user.instituteVerification.comments && (
            <p><strong>Reason:</strong> {user.instituteVerification.comments}</p>
          )}
        </Alert>
      )}
      
      <Card>
        <Card.Body>
          <Card.Title>Complete Institute Verification</Card.Title>
          <Card.Text className="text-muted mb-4">
            Please provide the following information to verify your institute account.
            This information is required to access bulk ordering and special discounts.
          </Card.Text>
          
          <Form onSubmit={handleSubmit}>
            <h5 className="mb-3">Institute Information</h5>
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Form.Group controlId="instituteName">
                  <Form.Label>Institute Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="instituteName"
                    value={formData.instituteName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="schoolName">
                  <Form.Label>School/College Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="g-3 mb-4">
              <Col md={4}>
                <Form.Group controlId="invoiceNumber">
                  <Form.Label>Invoice Number *</Form.Label>
                  <Form.Control
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="panNumber">
                  <Form.Label>PAN Number *</Form.Label>
                  <Form.Control
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="gstNumber">
                  <Form.Label>GST Number (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Form.Group controlId="contactNumber">
                  <Form.Label>Contact Number *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="type">
                  <Form.Label>Institute Type *</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="school">School</option>
                    <option value="college">College/University</option>
                    <option value="wholesaler">Wholesaler</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <h5 className="mb-3 mt-4">Additional Information</h5>
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Form.Group controlId="contactPerson">
                  <Form.Label>Contact Person *</Form.Label>
                  <Form.Control
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="phone">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Form.Group controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="grades">
                  <Form.Label>Grades/Classes (comma separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="grades"
                    value={formData.grades}
                    onChange={handleChange}
                    placeholder="e.g., 1, 2, 3, 4, 5 or FY, SY, TY"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-4" controlId="address">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-between">
              <Button variant="outline-secondary" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Verification"
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InstituteVerification;