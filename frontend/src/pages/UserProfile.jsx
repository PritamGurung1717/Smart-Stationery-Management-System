import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Card, Form, Button, Row, Col, Spinner, Alert, Tab, Tabs } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const UserProfile = ({ setUser }) => {
  const navigate = useNavigate();
  const [user, setLocalUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setLocalUser(storedUser);
    setProfileForm({
      name: storedUser.name || "",
      email: storedUser.email || "",
      phone: storedUser.phone || "",
      address: storedUser.address || "",
    });
  }, [navigate]);

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "http://localhost:5000/api/users/profile",
        profileForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = { ...user, ...response.data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setLocalUser(updatedUser);
      setUser(updatedUser);
      
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/users/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      alert("Password changed successfully! Please login again.");
      
      // Logout and redirect to login
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password: " + (error.response?.data?.message || error.message));
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
      <h1 className="mb-4">My Profile</h1>
      
      <Card>
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="profile" title="Profile Information">
              <Form onSubmit={handleProfileUpdate} className="mt-3">
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="name">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="email">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="g-3 mt-3">
                  <Col md={6}>
                    <Form.Group controlId="phone">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mt-3" controlId="address">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={profileForm.address}
                    onChange={handleProfileChange}
                  />
                </Form.Group>
                
                <Button
                  variant="primary"
                  type="submit"
                  className="mt-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </Form>
            </Tab>
            
            <Tab eventKey="password" title="Change Password">
              <Form onSubmit={handlePasswordUpdate} className="mt-3">
                <Form.Group className="mb-3" controlId="currentPassword">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="newPassword">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="confirmPassword">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </Form.Group>
                
                <Alert variant="info" className="mb-3">
                  <strong>Password Requirements:</strong>
                  <ul className="mb-0 mt-1">
                    <li>Minimum 8 characters</li>
                    <li>At least one uppercase letter</li>
                    <li>At least one number</li>
                    <li>At least one special character (@$!%*?&)</li>
                  </ul>
                </Alert>
                
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </Form>
            </Tab>
            
            <Tab eventKey="account" title="Account Info">
              <div className="mt-3">
                <Row className="mb-3">
                  <Col md={6}>
                    <p><strong>Account Type:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Account Status:</strong> 
                      <span className={`ms-2 badge bg-${user.status === "active" ? "success" : "danger"}`}>
                        {user.status}
                      </span>
                    </p>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <p><strong>Email Verified:</strong> 
                      <span className={`ms-2 badge bg-${user.isVerified ? "success" : "warning"}`}>
                        {user.isVerified ? "Verified" : "Not Verified"}
                      </span>
                    </p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                  </Col>
                </Row>
                
                {user.role === "institute" && user.instituteVerification && (
                  <div className="mt-3">
                    <h5>Institute Verification</h5>
                    <p><strong>Status:</strong> 
                      <span className={`ms-2 badge bg-${
                        user.instituteVerification.status === "approved" ? "success" :
                        user.instituteVerification.status === "pending" ? "warning" : "danger"
                      }`}>
                        {user.instituteVerification.status}
                      </span>
                    </p>
                    {user.instituteInfo && (
                      <p><strong>Institute Name:</strong> {user.instituteInfo.schoolName}</p>
                    )}
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UserProfile;