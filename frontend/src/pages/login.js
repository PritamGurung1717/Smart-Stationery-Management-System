import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css";

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

      // Redirect based on user role
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
        // Institute needs verification
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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <span className="logo-icon">✏️</span>
            <h1>Smart Stationery</h1>
          </div>
          <h2>Welcome</h2>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
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

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="forgot-password">
          <span
            className="link"
            onClick={() => navigate("/forgot-password")}
            style={{ cursor: "pointer", fontSize: "14px" }}
          >
            Forgot Password?
          </span>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <span className="link" onClick={() => navigate("/register")}>
              Create Account
            </span>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;