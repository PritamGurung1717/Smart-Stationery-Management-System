import React, { useState } from "react";
import { Form, Button, Container, Row, Col, Card, InputGroup, Spinner } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/users/login", form);

      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);

      if (res.data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else if (res.data.user.role === "institute") {
        if (res.data.user.instituteVerification?.status === "approved") {
          navigate("/dashboard");
        } else {
          navigate("/institute-verification");
        }
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        const tempUser = {
          email: form.email,
          role: "institute",
          needsVerification: true
        };
        localStorage.setItem("user", JSON.stringify(tempUser));
        navigate("/institute-verification");
      } else {
        setError(err?.response?.data?.message || "Login failed");
      }
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
                <div className="mb-2">
                  <span style={{ fontSize: "2rem" }}>✏️</span>
                </div>
                <h3>Smart Stationery</h3>
                <p className="text-muted">Sign in to your account</p>
              </div>

              {/* Error Message */}
              {error && <div className="alert alert-danger">{error}</div>}

              {/* Login Form */}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label>Email address</Form.Label>
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

                <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" /> Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </Form>

              {/* Forgot Password */}
              <div className="text-center mt-3">
                <span
                  className="text-primary"
                  style={{ cursor: "pointer", fontSize: "0.9rem" }}
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot Password?
                </span>
              </div>

              {/* Footer */}
              <div className="text-center mt-3">
                <p style={{ fontSize: "0.9rem" }}>
                  Don't have an account?{" "}
                  <span
                    className="text-primary"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/register")}
                  >
                    Create Account
                  </span>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
