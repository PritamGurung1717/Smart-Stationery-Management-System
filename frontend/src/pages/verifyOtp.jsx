import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup, Spinner } from "react-bootstrap";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const VerifyOtp = ({ setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (location.state?.email) setEmail(location.state.email);
    else navigate("/register");

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location, navigate]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post("http://localhost:5000/api/users/verify-otp", {
        email,
        otp: otpString
      });

      setSuccess("Email verified successfully!");
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      if (setUser) setUser(res.data.user);

      setTimeout(() => {
        if (res.data.user.role === "admin") navigate("/admin-dashboard");
        else if (res.data.user.role === "institute") navigate("/institute-verification");
        else navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post("http://localhost:5000/api/users/resend-otp", { email });
      setSuccess("New OTP sent to your email");
      setCanResend(false);
      setCountdown(60);

      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
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
                <div style={{ fontSize: "2rem" }}>✏️</div>
                <h3>Smart Stationery</h3>
                <p className="text-muted">Enter the 6-digit code sent to {email}</p>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              {/* OTP Form */}
              <Form onSubmit={handleSubmit}>
                <InputGroup className="mb-3 justify-content-center">
                  {otp.map((digit, index) => (
                    <Form.Control
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="text-center mx-1"
                      style={{ width: "3rem", fontSize: "1.5rem" }}
                      required
                    />
                  ))}
                </InputGroup>

                <Button variant="primary" type="submit" className="w-100 mb-3" disabled={loading}>
                  {loading ? <><Spinner animation="border" size="sm" /> Verifying...</> : "Verify Email"}
                </Button>
              </Form>

              <div className="text-center mb-2">
                <p>
                  Didn't receive the code?{" "}
                  {canResend ? (
                    <span className="text-primary" style={{ cursor: "pointer" }} onClick={handleResendOtp}>
                      Resend OTP
                    </span>
                  ) : (
                    <span className="text-muted">Resend OTP in {countdown}s</span>
                  )}
                </p>
              </div>

              <div className="text-center">
                <Button variant="secondary" onClick={() => navigate("/login")}>
                  Back to Login
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VerifyOtp;
