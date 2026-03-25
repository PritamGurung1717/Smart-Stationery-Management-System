import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "personal" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError("");
    try {
      await axios.post("http://localhost:5000/api/users/register", {
        name: form.name, email: form.email, password: form.password, role: form.role,
      });
      navigate("/verifyOtp", { state: { email: form.email } });
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", border: "1px solid #e5e7eb", borderRadius: 8,
    padding: "0.65rem 0.85rem", fontSize: "0.9rem", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: "2rem 1rem" }}>
      {/* Brand */}
      <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2rem", fontWeight: 400, color: "#111", letterSpacing: "-0.02em" }}>
          smartstationery.
        </div>
        <p style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: "0.4rem" }}>Create your account</p>
      </div>

      {/* Card */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "2.5rem 2rem", width: "100%", maxWidth: 420 }}>
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: "1.1rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>Full Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Your full name"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#111"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "1.1rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>Email address</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#111"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1.1rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: "2.75rem" }}
                onFocus={e => e.target.style.borderColor = "#111"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "#9ca3af", padding: 0 }}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>Confirm Password</label>
            <input type={showPassword ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required placeholder="••••••••"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#111"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>

          {/* Account Type */}
          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.75rem" }}>Account Type</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {["personal", "institute"].map(r => (
                <label key={r} style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", border: `1.5px solid ${form.role === r ? "#111" : "#e5e7eb"}`, borderRadius: 8, padding: "0.65rem 0.85rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: form.role === r ? 600 : 400, background: form.role === r ? "#f9fafb" : "#fff", transition: "all 0.15s" }}>
                  <input type="radio" name="role" value={r} checked={form.role === r} onChange={handleChange} style={{ accentColor: "#111" }} />
                  {r === "personal" ? "Personal" : "Institute"}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: "100%", background: loading ? "#6b7280" : "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.75rem", fontWeight: 600, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Creating Account…" : "Create Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "#6b7280" }}>
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} style={{ color: "#111", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
