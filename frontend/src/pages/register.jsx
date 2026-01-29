import React, { useState } from "react";
import { Form, Button, Container, Row, Col, Card, InputGroup, Spinner } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "personal",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/users/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      setSuccess(res.data.message);
      navigate("/verifyOtp", { state: { email: form.email } });
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="vh-100 d-flex justify-content-center align-items-center">
      <Row className="w-100">
        <Col md={{ span: 6, offset: 3 }} lg={{ span: 4, offset: 4 }}>
          <Card className="shadow-sm">
            <Card.Body>
              {/* Header */}
              <div className="text-center mb-4">
                <div className="mb-2" style={{ fontSize: "2rem" }}>✏️</div>
                <h3>Smart Stationery</h3>
                <p className="text-muted">Create your account</p>
              </div>

              {/* Error/Success Messages */}
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              {/* Registration Form */}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formName">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter full name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                    <Button
                      variant="outline-secondary"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formConfirmPassword">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Account Type */}
                <Form.Group className="mb-3">
                  <Form.Label>Account Type</Form.Label>
                  <div>
                    <Form.Check
                      inline
                      label="Personal Account"
                      name="role"
                      type="radio"
                      value="personal"
                      checked={form.role === "personal"}
                      onChange={handleChange}
                    />
                    <Form.Check
                      inline
                      label="Institute Account"
                      name="role"
                      type="radio"
                      value="institute"
                      checked={form.role === "institute"}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" /> Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </Form>

              {/* Footer */}
              <div className="text-center mt-3">
                <p>
                  Already have an account?{" "}
                  <span className="text-primary" style={{ cursor: "pointer" }} onClick={() => navigate("/login")}>
                    Sign In
                  </span>
                </p>
                <p style={{ fontSize: "0.8rem" }}>
                  By creating an account, you agree to our{" "}
                  <span className="text-primary">Terms of Service</span> and{" "}
                  <span className="text-primary">Privacy Policy</span>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
