import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "personal"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
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
        role: form.role
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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <span className="logo-icon">✏️</span>
            <h1>Smart Stationery</h1>
          </div>
          <h2>Create Account</h2>
          <p>Get started with your free account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="input-group">
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Account Type</label>
            <div className="role-options">
              <label className={`role-option ${form.role === 'personal' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="personal"
                  checked={form.role === "personal"}
                  onChange={handleChange}
                  required
                />
                <div className="role-content">
                  
                  <div>
                    <strong>Personal Account</strong>
                    
                  </div>
                </div>
              </label>
              
              <label className={`role-option ${form.role === 'institute' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="institute"
                  checked={form.role === "institute"}
                  onChange={handleChange}
                  required
                />
                <div className="role-content">
                  
                  <div>
                    <strong>Institute Account</strong>
                    
                  </div>
                </div>
              </label>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <span className="link" onClick={() => navigate("/login")}>
              Sign In
            </span>
          </p>
          <p className="terms">
            By creating an account, you agree to our 
            <span className="link"> Terms of Service </span>
            and <span className="link">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;