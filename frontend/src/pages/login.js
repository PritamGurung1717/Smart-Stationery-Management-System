import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css";

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setUser(res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
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

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="switch">
          New user? <span onClick={() => navigate("/register")} className="link">Register</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
