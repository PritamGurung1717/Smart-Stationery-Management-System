import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./register.css";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/users/register", form, { timeout: 20000 });
      setSuccess(res.data.message || "Registered. Check your email for OTP.");
      // navigate to verify-otp with email in state so user doesn't wait
      navigate("/verify-otp", { state: { email: form.email } });
    } catch (err) {
      const msg = err?.response?.data?.message || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="switch">
          Already have an account? <span onClick={() => navigate("/login")} className="link">Login</span>
        </p>
      </div>
    </div>
  );
};

export default Register;
