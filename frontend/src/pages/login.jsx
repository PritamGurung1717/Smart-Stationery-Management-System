import { useState } from "react";
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

      if (res.data.user.role === "admin") navigate("/admin-dashboard");
      else if (res.data.user.role === "institute") {
        if (res.data.user.instituteVerification?.status === "approved") navigate("/dashboard");
        else navigate("/institute-verification");
      } else navigate("/dashboard");
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        localStorage.setItem("user", JSON.stringify({ email: form.email, role: "institute", needsVerification: true }));
        navigate("/institute-verification");
      } else {
        setError(err?.response?.data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: "2rem 1rem" }}>
      {/* Brand */}
      <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2rem", fontWeight: 400, color: "#111", letterSpacing: "-0.02em" }}>
          smartstationery.
        </div>
        <p style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: "0.4rem" }}>Sign in to your account</p>
      </div>

      {/* Card */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "2.5rem 2rem", width: "100%", maxWidth: 400 }}>
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>Email address</label>
            <input
              type="email" name="email" value={form.email} onChange={handleChange} required
              placeholder="you@example.com"
              style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.65rem 0.85rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
              onFocus={e => e.target.style.borderColor = "#111"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required
                placeholder="••••••••"
                style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.65rem 2.75rem 0.65rem 0.85rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "#111"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "#9ca3af", padding: 0 }}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: "100%", background: loading ? "#6b7280" : "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.75rem", fontWeight: 600, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s" }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "#6b7280" }}>
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")} style={{ color: "#111", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
            Create Account
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
